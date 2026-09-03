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
from starlette.status import HTTP_422_UNPROCESSABLE_CONTENT

import schemas
from auth import (
    ALGORITHM,
    JWT_SECRET,
    check_password,
    create_access_token,
    generate_password,
    get_current_user,
)
from database import Base, engine, get_db
from models import Cliente, ItemOrcamento, Orcamento, User
from storage import storage_manager

IS_DEVELOPMENT_ENV = True if os.getenv("APP_ENV") == "dev" else False

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="OrçaMaster Marcenaria Backend API",
    description="API FastAPI com SQLite para Gestão de Orçamentos de Marcenaria com Suporte Prometheus e Structured Logging",
    version="1.0.0",
    debug=IS_DEVELOPMENT_ENV,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import sys
import traceback
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    print(f"❌ ERRO CRÍTICO NA ROTA {request.url.path}:", file=sys.stderr)
    traceback.print_exc()
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
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
        endereco=payload.endereco,
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
    if payload.endereco is not None:
        cliente.endereco = payload.endereco

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
        criadoEm=datetime.datetime.now(datetime.timezone.utc).isoformat(),
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
async def update_orcamento(
    orcamento_id: str,
    payload: Annotated[schemas.OrcamentoUpdate, Form(media_type="multipart/form-data")],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orc = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()
    if not orc:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")

    file_check_contents = await payload.arquivo.read(1) if payload.arquivo else 0
    if file_check_contents:
        if str(orc.arquivoId):
            storage_manager.delete_file(str(orc.arquivoId))
        file_result = storage_manager.save_file(payload.arquivo)
        orc.arquivoId = file_result["minio_filename_id"] if file_result else ""
        orc.arquivoNome = payload.arquivoNome

    if not file_check_contents and str(orc.arquivoId):
        storage_manager.delete_file(str(orc.arquivoId))
        orc.arquivoId = ""
        orc.arquivoNome = ""

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


# @app.get("/api/files")
# def list_files(current_user: User = Depends(get_current_user)):
#     return storage_manager.list_files()


import mimetypes
@app.get("/api/files/{file_id}")
def get_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        file_content: bytes = storage_manager.get_file(file_id)
        content_type, _ = mimetypes.guess_type(file_id)
        if not content_type:
            content_type = "application/octet-stream"
        return Response(
            content=file_content,
            media_type=content_type,
            headers={"Content-Disposition": f'inline; filename="{file_id}"'},
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


from io import BytesIO

from fastapi import FastAPI, HTTPException, Response
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# Definição das Cores do Layout
COR_ORANGE = colors.HexColor("#F97316")
COR_TEXTO_DARK = colors.HexColor("#1E293B")
COR_AZUL_HDR = colors.HexColor("#0284C7")
COR_BG_TABELA = colors.HexColor("#F0F9FF")
COR_BORDA = colors.HexColor("#BAE6FD")


def criar_estilos():
    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            "TituloPrincipal",
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            alignment=TA_CENTER,
            textColor=COR_TEXTO_DARK,
        )
    )

    styles.add(
        ParagraphStyle(
            "SecaoTitulo",
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=COR_AZUL_HDR,
            spaceBefore=10,
            spaceAfter=4,
        )
    )

    styles.add(
        ParagraphStyle(
            "TextoCorpo",
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=COR_TEXTO_DARK,
        )
    )

    styles.add(
        ParagraphStyle(
            "CellLabel",
            fontName="Helvetica-Bold",
            fontSize=7,
            leading=9,
            textColor=COR_AZUL_HDR,
        )
    )

    styles.add(
        ParagraphStyle(
            "CellValue",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=COR_TEXTO_DARK,
        )
    )

    styles.add(
        ParagraphStyle(
            "RodapeEnd",
            fontName="Helvetica-Bold",
            fontSize=8,
            alignment=TA_CENTER,
            textColor=COR_ORANGE,
        )
    )

    styles.add(
        ParagraphStyle(
            "TextoLegal",
            fontName="Helvetica-Oblique",
            fontSize=7.5,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#64748B"),
        )
    )

    return styles


def get_actual_data_de_emissao():
    DIAS = [
        "segunda-feira",
        "terça-feira",
        "quarta-feira",
        "quinta-feira",
        "sexta-feira",
        "sábado",
        "domingo",
    ]

    MESES = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
    ]

    agora = datetime.datetime.now()

    dia_semana = DIAS[agora.weekday()]
    mes = MESES[agora.month - 1]

    return f"{dia_semana}, {agora.day} de {mes} de {agora.year} às {agora.strftime('%H:%M')}"


import re
from html import unescape


def limpar_html_para_reportlab(texto_html: str) -> str:
    if not texto_html:
        return ""

    # 1. Substitui quebras de linha/divs por quebras <br/>
    texto = re.sub(r"</div>\s*<div>", "<br/>", texto_html, flags=re.IGNORECASE)
    texto = re.sub(r"<br\s*/?>", "<br/>", texto, flags=re.IGNORECASE)

    # 2. Remove tags não suportadas pelo ReportLab (div, p, span, etc.)
    # Mantenha apenas tags aceitas: b, i, u, font, super, sub, strike, a
    tags_permitidas = ["b", "i", "u", "font", "a", "br"]

    # Remove divs e p mas mantendo o conteúdo interno
    texto = re.sub(r"</?(?:div|p|span)[^>]*>", "", texto, flags=re.IGNORECASE)

    # 3. Garante que qualquer <br> sem fechamento seja <br/>
    texto = re.sub(r"<br(?!\s*/\s*>)", "<br/>", texto, flags=re.IGNORECASE)

    # 4. Remove tags malformadas ou vazias tipo <br></br>
    texto = re.sub(r"<br\s*>\s*</br\s*>", "<br/>", texto, flags=re.IGNORECASE)

    return texto.strip()


from num2words import num2words


@app.get("/api/orcamentos/{orcamento_id}/pdf")
async def gerar_pdf_orcamento(
    orcamento_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # --- 1. MOCK / BUSCA DOS DADOS NO BANCO ---
    # Substitua com a consulta real ao seu banco de dados usando o orcamento_id
    orcamento = db.query(Orcamento).filter(Orcamento.id == orcamento_id).first()
    cliente = db.query(Cliente).filter(Cliente.id == orcamento.cliente_id).first()
    dados = {
        "cliente": cliente.nome,
        "numero": cliente.celular,
        "data_emissao": get_actual_data_de_emissao(),
        "endereco": cliente.endereco,
        "validade": "10 dias a contar da data da emissão",
        "saudacao": limpar_html_para_reportlab(orcamento.introducao),
        "materia_prima": limpar_html_para_reportlab(orcamento.materiaPrima),
        "itens": orcamento.itens,
        "valor_total": orcamento.valor_total,
        "valor_extenso": num2words(
            orcamento.valor_total, lang="pt_BR", to="currency"
        ).capitalize(),
        "pagamento": orcamento.formaPagamento,
        "prazo": "O prazo será à combinar.",
        "empresa_endereco": current_user.endereco,
    }

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=30,
        rightMargin=30,
        topMargin=20,
        bottomMargin=20,
    )

    story = []
    styles = criar_estilos()

    # --- 2. LINHA LARANJA SUPERIOR ---
    story.append(HRFlowable(width="100%", thickness=3, color=COR_ORANGE, spaceAfter=15))

    # --- 3. CABEÇALHO LOGOMARCA ---
    tbl_logo_data = [
        [
            Paragraph(
                "<b>MARCENARIA</b>",
                ParagraphStyle(
                    "LogoTxt",
                    fontName="Helvetica-Bold",
                    fontSize=16,
                    textColor=COR_ORANGE,
                    alignment=TA_CENTER,
                ),
            )
        ],
        [
            Paragraph(
                "MÓVEIS PROJETADOS EM GERAL",
                ParagraphStyle(
                    "SubLogo",
                    fontName="Helvetica-Bold",
                    fontSize=8,
                    textColor=colors.HexColor("#64748B"),
                    alignment=TA_CENTER,
                ),
            )
        ],
    ]
    tbl_logo = Table(tbl_logo_data, colWidths=[200])
    tbl_logo.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 1, COR_TEXTO_DARK),
                ("ROUNDEDCORNERS", [6, 6, 6, 6]),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    # Envelopa o logo para centralizar na folha
    tbl_logo_wrapper = Table([[tbl_logo]], colWidths=[535])
    tbl_logo_wrapper.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(tbl_logo_wrapper)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=COR_ORANGE, spaceAfter=15))

    # --- 4. TÍTULO DO DOCUMENTO ---
    story.append(Paragraph("ORÇAMENTO / PROPOSTA", styles["TituloPrincipal"]))
    story.append(Spacer(1, 12))

    # --- 5. GRID DE DADOS DO CLIENTE E PROPOSTA ---
    dados_cliente_grid = [
        [
            Paragraph(
                "CLIENTE / CONTRATANTE<br/><b>" + dados["cliente"] + "</b>",
                styles["CellValue"],
            ),
            Paragraph("NÚMERO<br/><b>" + dados["numero"] + "</b>", styles["CellValue"]),
            Paragraph(
                "DATA DA EMISSÃO<br/><b>" + dados["data_emissao"] + "</b>",
                styles["CellValue"],
            ),
        ],
        [
            Paragraph(
                "ENDEREÇO<br/><b>" + dados["endereco"] + "</b>", styles["CellValue"]
            ),
            "",
            Paragraph(
                "VALIDADE DA PROPOSTA<br/><b>" + dados["validade"] + "</b>",
                styles["CellValue"],
            ),
        ],
    ]

    tbl_cliente = Table(dados_cliente_grid, colWidths=[200, 165, 170])
    tbl_cliente.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, COR_BORDA),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, COR_BORDA),
                ("BACKGROUND", (0, 0), (-1, -1), COR_BG_TABELA),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("SPAN", (0, 1), (1, 1)),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(tbl_cliente)
    story.append(Spacer(1, 12))

    # --- 6. SAUDAÇÃO E ESPECIFICAÇÕES TÉCNICAS ---
    # story.append(Paragraph("Prezado(a) Cliente,", styles["TextoCorpo"]))
    story.append(Paragraph(dados["saudacao"], styles["TextoCorpo"]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("ESPECIFICAÇÕES TÉCNICAS", styles["SecaoTitulo"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=COR_BORDA, spaceAfter=6))

    story.append(Paragraph("MATÉRIA PRIMA", styles["SecaoTitulo"]))
    story.append(Paragraph(dados["materia_prima"], styles["TextoCorpo"]))
    story.append(Spacer(1, 10))

    # --- 7. AMBIENTE E ESPECIFICAÇÕES DO PROJETO (TABELA) ---
    story.append(
        Paragraph("AMBIENTE E ESPECIFICAÇÕES DO PROJETO", styles["SecaoTitulo"])
    )

    header_tabela = [
        Paragraph("<b>LOCAL / AMBIENTE</b>", styles["CellLabel"]),
        Paragraph("<b>O QUE SERÁ FEITO</b>", styles["CellLabel"]),
        Paragraph(
            "<b>VALORES</b>",
            ParagraphStyle("R", parent=styles["CellLabel"], alignment=TA_RIGHT),
        ),
    ]

    tabela_itens_data = [header_tabela]

    for item in dados["itens"]:
        tabela_itens_data.append(
            [
                Paragraph(item.local, styles["TextoCorpo"]),
                Paragraph(item.servico, styles["TextoCorpo"]),
                Paragraph(
                    f"<b>{item.valor}</b>",
                    ParagraphStyle(
                        "RVal", parent=styles["TextoCorpo"], alignment=TA_RIGHT
                    ),
                ),
            ]
        )

    # Linha Total
    tabela_itens_data.append(
        [
            "",
            Paragraph(
                "<b>Total Geral em R$</b>",
                ParagraphStyle(
                    "TotLbl",
                    parent=styles["CellValue"],
                    alignment=TA_RIGHT,
                    textColor=COR_AZUL_HDR,
                ),
            ),
            Paragraph(
                f"<b>{dados['valor_total']}</b>",
                ParagraphStyle(
                    "TotVal", parent=styles["CellValue"], alignment=TA_RIGHT
                ),
            ),
        ]
    )

    # Linha Extenso
    tabela_itens_data.append(
        [
            Paragraph(
                f"<b>VALOR POR EXTENSO DO ORÇAMENTO / PROPOSTA</b><br/>{dados['valor_extenso']}",
                styles["CellValue"],
            ),
            "",
            "",
        ]
    )

    tbl_itens = Table(tabela_itens_data, colWidths=[160, 275, 100])
    tbl_itens.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, COR_BORDA),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, COR_BORDA),
                ("BACKGROUND", (0, 0), (-1, 0), COR_BG_TABELA),
                ("SPAN", (0, 3), (2, 3)),  # Une as colunas para o texto por extenso
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(tbl_itens)
    story.append(Spacer(1, 10))

    # --- 8. PAGAMENTO E PRAZO ---
    story.append(Paragraph("FORMAS DE PAGAMENTO", styles["SecaoTitulo"]))
    story.append(Paragraph(dados["pagamento"], styles["TextoCorpo"]))
    story.append(Spacer(1, 6))

    story.append(Paragraph("PRAZO DE ENTREGA", styles["SecaoTitulo"]))
    story.append(Paragraph(f"• {dados['prazo']}", styles["TextoCorpo"]))
    story.append(Spacer(1, 20))

    # --- 9. CLÁUSULA LEGAL E ASSINATURAS ---
    story.append(
        Paragraph(
            "<i>Sendo assim, as partes estando de acordo, assinam e reconhece a PROPOSTA / ORÇAMENTO como legítimo.</i>",
            styles["TextoLegal"],
        )
    )
    story.append(Spacer(1, 30))

    linha_assinatura = [
        [
            Paragraph(
                "____________________________________________<br/><b>"
                + dados["cliente"]
                + "</b><br/><font size=7 color='#64748B'>Cliente / Contratante</font>",
                ParagraphStyle("C1", parent=styles["TextoCorpo"], alignment=TA_CENTER),
            ),
            Paragraph(
                "____________________________________________<br/><b>"
                + current_user.nome
                + "</b><br/><font size=7 color='#64748B'>Contratado</font>",
                ParagraphStyle("C2", parent=styles["TextoCorpo"], alignment=TA_CENTER),
            ),
        ]
    ]
    tbl_assinaturas = Table(linha_assinatura, colWidths=[260, 260])
    story.append(tbl_assinaturas)
    story.append(Spacer(1, 20))

    # --- 10. RODAPÉ E LINHA LARANJA INFERIOR ---
    story.append(
        HRFlowable(width="100%", thickness=1.5, color=COR_ORANGE, spaceAfter=8)
    )
    story.append(Paragraph(dados["empresa_endereco"], styles["RodapeEnd"]))

    # --- 11. BUILD PDF ---
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=orcamento_{orcamento_id}.pdf"
        },
    )


@app.delete("/api/files/{file_id}")
def delete_file(file_id: str, current_user: User = Depends(get_current_user)):
    success = storage_manager.delete_file(file_id)
    if not success:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    return {"message": "Arquivo removido com sucesso."}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
