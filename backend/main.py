import datetime
import os
import re
import time
import uuid
from typing import Annotated, List

import jwt
from fastapi import (
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from backend import schemas
from backend.auth import ALGORITHM, JWT_SECRET, create_access_token, get_current_user, generate_password, check_password
from backend.database import Base, engine, get_db
from backend.models import Cliente, ItemOrcamento, Orcamento, User
from backend.storage import storage_manager

IS_DEVELOPMENT_ENV = True if os.getenv("APP_ENV") == "dev" else False

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="OrçaMaster Marcenaria Backend API",
    description="API FastAPI com SQLite para Gestão de Orçamentos de Marcenaria com Suporte Prometheus e Structured Logging",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})


@app.post(
    "/api/auth/register",
    response_model=schemas.LoginResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    payload: schemas.UserRegister, response: Response, db: Session = Depends(get_db)
):
    if not payload.nome or not payload.email or not payload.senha:
        err_msg = "Nome, e-mail e senha são obrigatórios."
        raise HTTPException(status_code=400, detail=err_msg)

    password_regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
    if not re.match(password_regex, payload.senha):
        err_msg = "A senha deve conter no mínimo 8 caracteres, incluindo pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial."
        raise HTTPException(status_code=400, detail=err_msg)

    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        err_msg = "Este e-mail já está cadastrado no sistema."
        raise HTTPException(status_code=400, detail=err_msg)

    user_id = str(uuid.uuid4())
    new_user = User(
        id=user_id,
        nome=payload.nome,
        email=payload.email.lower(),
        senha=generate_password(payload.senha),
        razaoSocial=payload.razaoSocial or "",
        nomeFantasia=payload.nomeFantasia or "",
        cnpj=payload.cnpj or "",
        telefone=payload.telefone or "",
        endereco=payload.endereco or "",
        logomarca="",
        introducao="",
        materiaPrima="",
        formaPagamento="",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(
        {"id": new_user.id, "email": new_user.email, "nome": new_user.nome}
    )

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="strict",
        secure=False,
        max_age=43200,
        path="/",
    )

    return {
        "token": token,
        "user": new_user,
        "message": "Cadastro realizado com sucesso!",
    }


@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login_user(
    payload: schemas.UserLogin, response: Response, db: Session = Depends(get_db)
):
    if not payload.email or not payload.senha:
        raise HTTPException(
            status_code=400, detail="Por favor, informe e-mail e senha."
        )

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not check_password(payload.senha, str(user.senha)):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")

    token = create_access_token({"id": user.id, "email": user.email, "nome": user.nome})

    # Armazena o token em cookie HttpOnly com SameSite=Strict
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="strict",
        secure=False,
        max_age=43200,
        path="/",
    )

    return {"token": token, "user": user}


@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/api/auth/logout")
def logout_user(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logout realizado com sucesso!"}


@app.put("/api/user/profile", response_model=schemas.UserResponse)
def update_profile(
    payload: schemas.UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start_op = time.time()
    if payload.nome is not None:
        current_user.nome = payload.nome
    if payload.email is not None:
        current_user.email = payload.email.lower()
    if payload.razaoSocial is not None:
        current_user.razaoSocial = payload.razaoSocial
    if payload.nomeFantasia is not None:
        current_user.nomeFantasia = payload.nomeFantasia
    if payload.endereco is not None:
        current_user.endereco = payload.endereco
    if payload.telefone is not None:
        current_user.telefone = payload.telefone
    if payload.cnpj is not None:
        current_user.cnpj = payload.cnpj
    if payload.logomarca is not None:
        current_user.logomarca = payload.logomarca
    if payload.introducao is not None:
        current_user.introducao = payload.introducao
    if payload.materiaPrima is not None:
        current_user.materiaPrima = payload.materiaPrima
    if payload.formaPagamento is not None:
        current_user.formaPagamento = payload.formaPagamento

    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/api/user/change-password")
def change_password(
    payload: schemas.ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start_op = time.time()
    old_pw = payload.old_password or payload.oldPassword or payload.senha_atual
    new_pw = payload.new_password or payload.newPassword or payload.nova_senha

    if not old_pw or not new_pw:
        errors = {"error": "Senha atual e nova senha são obrigatórias."}
        if not old_pw:
            errors["old_password"] = ["Este campo é obrigatório."]
        if not new_pw:
            errors["new_password"] = ["Este campo é obrigatório."]
        raise HTTPException(status_code=400, detail=errors)

    if current_user.senha != old_pw:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "A senha atual está incorreta.",
                "old_password": ["A senha atual está incorreta."],
            },
        )

    if len(new_pw) < 6:
        AUTH_ATTEMPTS_TOTAL.labels(type="password_change", status="failure").inc()
        raise HTTPException(
            status_code=400,
            detail={
                "error": "A nova senha deve ter no mínimo 6 caracteres.",
                "new_password": ["A nova senha deve ter no mínimo 6 caracteres."],
            },
        )

    current_user.senha = new_pw
    db.commit()
    return {"message": "Senha alterada com sucesso!"}


@app.post("/api/auth/esqueci-a-senha", response_model=schemas.PasswordResetResponse)
def esqueci_senha(payload: schemas.EsqueciSenha, db: Session = Depends(get_db)):
    start_op = time.time()
    if not payload.email:
        raise HTTPException(
            status_code=400, detail="Por favor, informe o e-mail de cadastro."
        )

    email_clean = payload.email.lower()
    user = db.query(User).filter(User.email == email_clean).first()

    token = create_access_token(
        {"email": email_clean, "purpose": "password-reset"},
        expires_delta=datetime.timedelta(hours=1),
    )

    if user:
        return {
            "message": "Instruções de recuperação e token de redefinição foram gerados com sucesso!",
            "tokenDemo": token,
            "emailSentTo": email_clean,
        }

    return {
        "message": "Se o e-mail estiver cadastrado em nosso sistema, você receberá o token de recuperação.",
        "tokenDemo": token,
        "emailSentTo": email_clean,
    }


@app.post("/api/auth/reset-password")
def reset_password(payload: schemas.ResetPassword, db: Session = Depends(get_db)):
    start_op = time.time()
    if not payload.token or not payload.novaSenha:
        raise HTTPException(
            status_code=400,
            detail="Token de recuperação e nova senha são obrigatórios.",
        )

    try:
        decoded = jwt.decode(payload.token, JWT_SECRET, algorithms=[ALGORITHM])
        if decoded.get("purpose") != "password-reset":
            raise HTTPException(
                status_code=400, detail="Token inválido para redefinição de senha."
            )

        email = decoded.get("email")
        if email:
            user = db.query(User).filter(User.email == email.lower()).first()
            if user:
                user.senha = payload.novaSenha
                db.commit()

        return {"message": "Senha redefinida com sucesso! Você já pode realizar login."}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail="Token de redefinição inválido ou expirado."
        )


@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "nome": current_user.nome,
        }
    }


@app.get("/api/clientes", response_model=List[schemas.ClienteResponse])
def get_clientes(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    start_op = time.time()
    clientes = db.query(Cliente).all()
    return clientes


@app.post(
    "/api/clientes",
    response_model=schemas.ClienteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_cliente(
    payload: schemas.ClienteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.nome or not payload.celular or not payload.email:
        err_msg = "Nome, celular e e-mail são obrigatórios."
        raise HTTPException(status_code=400, detail=err_msg)

    cliente_id = str(uuid.uuid4())
    today = datetime.date.today().isoformat()

    apelido = payload.apelido or payload.nome.split(" ")[0]

    new_cliente = Cliente(
        id=cliente_id,
        user_id=current_user.id,
        nome=payload.nome,
        celular=payload.celular,
        email=payload.email,
        apelido=apelido,
        criadoEm=today,
    )
    db.add(new_cliente)
    db.commit()
    db.refresh(new_cliente)
    return new_cliente


@app.put("/api/clientes/{cliente_id}", response_model=schemas.ClienteResponse)
def update_cliente(
    cliente_id: str,
    payload: schemas.ClienteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start_op = time.time()
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    if payload.nome is not None:
        cliente.nome = payload.nome
    if payload.celular is not None:
        cliente.celular = payload.celular
    if payload.email is not None:
        cliente.email = payload.email
    if payload.apelido is not None:
        cliente.apelido = payload.apelido

    db.commit()
    db.refresh(cliente)
    return cliente


@app.delete("/api/clientes/{cliente_id}")
def delete_cliente(
    cliente_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start_op = time.time()
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    db.delete(cliente)
    db.commit()
    return {"message": "Cliente e orçamentos vinculados removidos com sucesso."}


# --- ORÇAMENTOS CRUD ---


def _build_orcamento_response(orc: Orcamento) -> dict:
    valor_total = sum(item.valor for item in orc.itens) if orc.itens else 0.0
    return {
        "id": orc.id,
        "cliente_id": orc.cliente_id,
        "data": orc.data,
        "dataEntrega": orc.dataEntrega or "",
        "status": orc.status or "Pendente",
        "observacoes": orc.observacoes or "",
        "arquivoId": orc.arquivoId or "",
        "arquivoNome": orc.arquivoNome or "",
        "introducao": orc.introducao or "",
        "materiaPrima": orc.materiaPrima or "",
        "formaPagamento": orc.formaPagamento or "",
        "criadoEm": orc.criadoEm,
        "cliente": orc.cliente,
        "itens": orc.itens,
        "valorTotal": valor_total,
    }


@app.get("/api/orcamentos", response_model=List[schemas.OrcamentoResponse])
def get_orcamentos(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    start_op = time.time()
    orcamentos = db.query(Orcamento).all()
    return [_build_orcamento_response(o) for o in orcamentos]


@app.get("/api/orcamentos/{orcamento_id}", response_model=schemas.OrcamentoResponse)
def get_orcamento_by_id(
    orcamento_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orc = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()
    if not orc:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")
    return _build_orcamento_response(orc)


@app.post(
    "/api/orcamentos",
    response_model=schemas.OrcamentoResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_orcamento(
    payload: Annotated[schemas.OrcamentoCreate, Form()],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.cliente_id or not payload.data:
        err_msg = "Cliente e Data são obrigatórios para o orçamento."
        raise HTTPException(status_code=400, detail=err_msg)

    cliente = db.query(Cliente).filter(Cliente.id == payload.cliente_id).first()
    if not cliente:
        err_msg = "Cliente selecionado não existe."
        raise HTTPException(status_code=400, detail=err_msg)

    new_orc_id = str(uuid.uuid4())
    file_result = (
        storage_manager.save_file(payload.arquivo)
        if payload.arquivo and payload.arquivo.filename
        else None
    )
    new_orc = Orcamento(
        id=new_orc_id,
        cliente_id=payload.cliente_id,
        data=payload.data,
        dataEntrega=payload.dataEntrega or "",
        status=payload.status or "Pendente",
        observacoes=payload.observacoes or "",
        arquivoId=file_result["minio_filename_id"] if file_result else "",
        arquivoNome=payload.arquivoNome or "",
        introducao=payload.introducao or "",
        materiaPrima=payload.materiaPrima or "",
        formaPagamento=payload.formaPagamento or "",
        criadoEm=datetime.date.today().isoformat(),
    )
    db.add(new_orc)

    if payload.itens:
        for idx, item in enumerate(payload.itens):
            item_id = item.id or str(uuid.uuid4())
            new_item = ItemOrcamento(
                id=item_id,
                orcamento_id=new_orc_id,
                servico=item.servico,
                descricao=item.descricao or "",
                local=item.local,
                valor=float(item.valor) if item.valor else 0.0,
            )
            db.add(new_item)

    db.commit()
    db.refresh(new_orc)
    return _build_orcamento_response(new_orc)


@app.put("/api/orcamentos/{orcamento_id}", response_model=schemas.OrcamentoResponse)
def update_orcamento(
    orcamento_id: str,
    payload: schemas.OrcamentoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start_op = time.time()
    orc = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()
    if not orc:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")

    if payload.cliente_id is not None:
        orc.cliente_id = payload.cliente_id
    if payload.data is not None:
        orc.data = payload.data
    if payload.dataEntrega is not None:
        orc.dataEntrega = payload.dataEntrega
    if payload.status is not None:
        orc.status = payload.status
    if payload.observacoes is not None:
        orc.observacoes = payload.observacoes
    if payload.arquivo is not None:
        orc.arquivo = payload.arquivo
    if payload.arquivoNome is not None:
        orc.arquivoNome = payload.arquivoNome
    if payload.introducao is not None:
        orc.introducao = payload.introducao
    if payload.materiaPrima is not None:
        orc.materiaPrima = payload.materiaPrima
    if payload.formaPagamento is not None:
        orc.formaPagamento = payload.formaPagamento

    if payload.itens is not None:
        # Delete existing items for this budget
        db.query(ItemOrcamento).filter(
            ItemOrcamento.orcamento_id == orcamento_id
        ).delete()
        for idx, item in enumerate(payload.itens):
            item_id = item.id or str(uuid.uuid4())
            new_item = ItemOrcamento(
                id=item_id,
                orcamento_id=orcamento_id,
                servico=item.servico,
                descricao=item.descricao or "",
                local=item.local,
                valor=float(item.valor) if item.valor else 0.0,
            )
            db.add(new_item)

    db.commit()
    db.refresh(orc)
    return _build_orcamento_response(orc)


@app.delete("/api/orcamentos/{orcamento_id}")
def delete_orcamento(
    orcamento_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start_op = time.time()
    orc = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()
    if not orc:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")

    db.delete(orc)
    db.commit()
    return {"message": "Orçamento e seus itens foram removidos com sucesso."}


# --- FILE STORAGE ENDPOINTS ---


@app.post("/api/files/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
):
    try:
        content_type = "application/octet-stream"
        filename = "uploaded_file"
        file_bytes = b""

        if file is not None:
            filename = file.filename or "uploaded_file"
            content_type = file.content_type or "application/octet-stream"
            file_bytes = await file.read()
        else:
            # Check JSON payload with base64 data
            try:
                data = await request.json()
                filename = data.get("filename", "uploaded_file")
                content_type = data.get("content_type", "application/octet-stream")
                b64 = data.get("base64_data", "")
                if "," in b64:
                    b64 = b64.split(",")[1]
                import base64

                file_bytes = base64.b64decode(b64) if b64 else b""
            except Exception:
                file_bytes = await request.body()

        if not file_bytes:
            raise HTTPException(
                status_code=400, detail="Nenhum conteúdo de arquivo fornecido."
            )

        metadata = storage_manager.save_file(
            file_bytes=file_bytes, original_filename=filename, content_type=content_type
        )
        return metadata
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Erro ao salvar arquivo: {str(exc)}"
        )


@app.get("/api/files")
def list_files(current_user: User = Depends(get_current_user)):
    return storage_manager.list_files()


@app.get("/api/files/{file_id}")
def get_file(file_id: str):
    try:
        file_bytes, filename, content_type = storage_manager.get_file(file_id)
        return Response(
            content=file_bytes,
            media_type=content_type,
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/api/files/{file_id}")
def delete_file(file_id: str, current_user: User = Depends(get_current_user)):
    success = storage_manager.delete_file(file_id)
    if not success:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    return {"message": "Arquivo removido com sucesso."}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
