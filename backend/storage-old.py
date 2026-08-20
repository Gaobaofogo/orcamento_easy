import datetime
import io
import os
import urllib.request
import uuid
from pathlib import Path

from fastapi import UploadFile

from backend.metrics import log_creation_event, logger

STORAGE_TYPE = os.getenv("STORAGE_TYPE")
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY")
MINIO_BUCKET = os.getenv("MINIO_BUCKET")


class StorageManager:
    def __init__(self):
        self.bucket = MINIO_BUCKET
        self.minio_endpoint = MINIO_ENDPOINT

    def save_file(
        self,
        upload_file: UploadFile,
        content_type: str = "application/octet-stream",
    ) -> dict:
        file_id = str(uuid.uuid4())
        ext = Path(upload_file.filename).suffix if upload_file.filename else ""
        stored_filename = f"{file_id}{ext}"

        minio_url = f"http://{MINIO_ENDPOINT}/{MINIO_BUCKET}/{stored_filename}"
        file_bytes = upload_file.read()
        try:
            req = urllib.request.Request(
                minio_url,
                data=upload_file.file,
                headers={
                    "Content-Type": content_type,
                    "Content-Length": str(upload_file.file.tell()),
                },
                method="PUT",
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status in (200, 201):
                    logger.info(
                        f"Arquivo salvo com sucesso no serviço MinIO: {minio_url}"
                    )
        except Exception as e:
            logger.error(f"Não foi possível salvar via HTTP no MinIO ({str(e)}).")

        metadata = {
            "id": file_id,
            "filename": upload_file.filename,
            "stored_filename": stored_filename,
            "content_type": content_type or "application/octet-stream",
            "size": upload_file.file.tell(),
            "url": f"/api/files/{file_id}",
            "created_at": datetime.datetime.utcnow().isoformat() + "Z",
        }

        return metadata

    def get_file(self, file_id: str) -> tuple[bytes, str, str]:
        minio_url = f"http://{MINIO_ENDPOINT}/{MINIO_BUCKET}/{metadata.get('stored_filename', file_id)}"
        try:
            req = urllib.request.Request(minio_url)
            with urllib.request.urlopen(req, timeout=3) as resp:
                content = resp.read()
                return content, metadata["filename"], metadata["content_type"]
        except Exception as err:
            logger.error(f"Erro ao buscar arquivo no MinIO: {str(err)}")

        raise FileNotFoundError(
            "Conteúdo do arquivo não foi encontrado no armazenamento."
        )

    def delete_file(self, file_id: str) -> bool:
        index = _load_index()
        if file_id in index:
            metadata = index.pop(file_id)
            _save_index(index)

            stored_filename = metadata.get("stored_filename", file_id)
            minio_url = f"http://{MINIO_ENDPOINT}/{MINIO_BUCKET}/{stored_filename}"
            try:
                req = urllib.request.Request(minio_url, method="DELETE")
                urllib.request.urlopen(req, timeout=3)
            except Exception:
                pass
            return True
        return False

    def list_files(self) -> list[dict]:
        index = _load_index()
        return list(index.values())


storage_manager = StorageManager()
