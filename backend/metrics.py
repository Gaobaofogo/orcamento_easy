import json
import logging
import os
import time

from prometheus_client import Counter, Histogram

HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total", "Total HTTP Requests", ["method", "endpoint", "status_code"]
)
HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP Request Latency in Seconds",
    ["method", "endpoint"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)
DB_OPERATIONS_TOTAL = Counter(
    "db_operations_total",
    "Total Database Operations executed",
    ["operation", "model", "status"],
)
DB_OPERATION_DURATION_SECONDS = Histogram(
    "db_operation_duration_seconds",
    "Database Operation Duration in Seconds",
    ["operation", "model"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
)
AUTH_ATTEMPTS_TOTAL = Counter(
    "auth_attempts_total",
    "Total Authentication Attempts",
)


IS_DEV = True if os.getenv("APP_ENV", None) == "dev" else False
DEFAULT_LOG_LEVEL = "DEBUG" if IS_DEV else "INFO"
LOG_LEVEL_STR = os.getenv("LOG_LEVEL", DEFAULT_LOG_LEVEL).upper()
LOG_LEVEL = getattr(logging, LOG_LEVEL_STR, logging.INFO)

SENSITIVE_KEYS = {
    "senha",
    "password",
    "old_password",
    "new_password",
    "senha_atual",
    "nova_senha",
    "novasenha",
    "token",
    "access_token",
    "authorization",
    "jwt",
    "tokendemo",
    "email",
    "emailsentto",
    "cpf",
    "cnpj",
    "telefone",
    "celular",
}


def sanitize_data(data: any) -> any:
    if data is None:
        return None
    if isinstance(data, (int, float, bool)):
        return data
    if isinstance(data, str):
        return data
    if isinstance(data, list):
        return [sanitize_data(item) for item in data]
    if isinstance(data, dict):
        sanitized = {}
        for key, val in data.items():
            if str(key).lower() in SENSITIVE_KEYS:
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = sanitize_data(val)
        return sanitized
    if hasattr(data, "model_dump"):
        return sanitize_data(data.model_dump())
    if hasattr(data, "dict"):
        return sanitize_data(data.dict())
    return str(data)


class JSONLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": time.strftime(
                "%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)
            ),
            "env": os.getenv("APP_ENV", None),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for key in [
            "http_method",
            "http_path",
            "status_code",
            "duration_ms",
            "client_ip",
            "user_id",
            "db_operation",
            "db_model",
            "error",
            "event",
            "resource",
            "model_id",
            "params",
            "query_params",
            "body",
        ]:
            if hasattr(record, key):
                log_data[key] = getattr(record, key)
        return json.dumps(log_data, ensure_ascii=False)


class DevLogFormatter(logging.Formatter):
    """Formatador legível e detalhado com suporte a debug em desenvolvimento."""

    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        time_str = time.strftime("%H:%M:%S", time.localtime(record.created))
        prefix = (
            f"{color}[{time_str}][DEV-{record.levelname}][{record.name}]{self.RESET}"
        )
        message = f"{prefix} {record.getMessage()}"

        # Anexa detalhes extras para ajudar no debug local
        extras = []
        for key in [
            "http_method",
            "http_path",
            "status_code",
            "duration_ms",
            "client_ip",
            "db_operation",
            "db_model",
            "params",
            "query_params",
            "error",
        ]:
            if hasattr(record, key):
                val = getattr(record, key)
                extras.append(f"{key}={val}")

        if extras:
            message += f" | {', '.join(extras)}"

        return message


def get_logger(name: str = "marcenaria.backend"):
    logger = logging.getLogger(name)
    logger.setLevel(LOG_LEVEL)
    if not logger.handlers:
        handler = logging.StreamHandler()
        if IS_DEV:
            handler.setFormatter(DevLogFormatter())
        else:
            handler.setFormatter(JSONLogFormatter())
        logger.addHandler(handler)
    return logger


logger = get_logger()


def log_creation_event(
    resource: str,
    model_id: str = None,
    payload: any = None,
    status: str = "success",
    error: str = None,
):
    sanitized_params = sanitize_data(payload)
    extra = {
        "event": "resource_created"
        if status == "success"
        else "resource_create_failed",
        "resource": resource,
        "status": status,
        "params": sanitized_params,
    }
    if model_id:
        extra["model_id"] = model_id
    if error:
        extra["error"] = error
        logger.error(f"Cadastro de {resource} falhou: {error}", extra=extra)
    else:
        logger.info(
            f"Cadastro de {resource} realizado com sucesso (ID: {model_id})",
            extra=extra,
        )


def log_db_operation(
    operation: str,
    model: str,
    start_time: float,
    status: str = "success",
    error: str = None,
):
    duration = time.time() - start_time
    DB_OPERATIONS_TOTAL.labels(operation=operation, model=model, status=status).inc()
    DB_OPERATION_DURATION_SECONDS.labels(operation=operation, model=model).observe(
        duration
    )

    extra = {
        "db_operation": operation,
        "db_model": model,
        "duration_ms": round(duration * 1000, 2),
        "status": status,
    }
    if error:
        extra["error"] = error
        logger.error(f"DB Op Failed: {operation} on {model}", extra=extra)
    else:
        logger.info(f"DB Op Executed: {operation} on {model}", extra=extra)
