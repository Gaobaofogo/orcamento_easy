import json
from typing import List, Optional

from fastapi import UploadFile
from pydantic import BaseModel, ConfigDict, field_validator, Field


class UserRegister(BaseModel):
    nome: str
    email: str
    senha: str = Field(min_length=8, max_length=64)
    razaoSocial: Optional[str] = ""
    nomeFantasia: Optional[str] = ""
    cnpj: Optional[str] = ""
    telefone: Optional[str] = ""
    endereco: Optional[str] = ""


class UserLogin(BaseModel):
    email: str
    senha: str


class UserProfileUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    razaoSocial: Optional[str] = None
    nomeFantasia: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    cnpj: Optional[str] = None
    logomarca: Optional[str] = None
    introducao: Optional[str] = None
    materiaPrima: Optional[str] = None
    formaPagamento: Optional[str] = None


class ChangePassword(BaseModel):
    old_password: Optional[str] = None
    oldPassword: Optional[str] = None
    senha_atual: Optional[str] = None
    new_password: Optional[str] = None
    newPassword: Optional[str] = None
    nova_senha: Optional[str] = None


class EsqueciSenha(BaseModel):
    email: str


class ResetPassword(BaseModel):
    token: str
    novaSenha: str


class UserResponse(BaseModel):
    id: str
    nome: str
    email: str
    razaoSocial: Optional[str] = ""
    nomeFantasia: Optional[str] = ""
    endereco: Optional[str] = ""
    telefone: Optional[str] = ""
    cnpj: Optional[str] = ""
    logomarca: Optional[str] = ""
    introducao: Optional[str] = ""
    materiaPrima: Optional[str] = ""
    formaPagamento: Optional[str] = ""

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    token: str
    user: UserResponse
    message: Optional[str] = None


class PasswordResetResponse(BaseModel):
    message: str
    tokenDemo: Optional[str] = None
    emailSentTo: Optional[str] = None


class ClienteCreate(BaseModel):
    nome: str
    celular: str
    email: str
    apelido: Optional[str] = None


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    celular: Optional[str] = None
    email: Optional[str] = None
    apelido: Optional[str] = None


class ClienteResponse(BaseModel):
    id: str
    nome: str
    celular: str
    email: str
    apelido: str
    criadoEm: str

    model_config = ConfigDict(from_attributes=True)


class ItemOrcamentoCreate(BaseModel):
    id: Optional[str] = None
    servico: str
    descricao: Optional[str] = ""
    local: str
    valor: float


class ItemOrcamentoResponse(BaseModel):
    id: str
    orcamento_id: str
    servico: str
    descricao: Optional[str] = ""
    local: str
    valor: float

    model_config = ConfigDict(from_attributes=True)


class OrcamentoCreate(BaseModel):
    cliente_id: str
    data: str
    dataEntrega: Optional[str] = ""
    status: Optional[str] = "Pendente"
    observacoes: Optional[str] = ""
    arquivo: Optional[UploadFile] = None
    arquivoNome: Optional[str] = ""
    introducao: Optional[str] = ""
    materiaPrima: Optional[str] = ""
    formaPagamento: Optional[str] = ""
    itens: Optional[List[ItemOrcamentoCreate]] = []

    @field_validator("itens", mode="before")
    @classmethod
    def parse_itens(cls, v):
        if isinstance(v, list) and len(v) == 1 and isinstance(v[0], str):
            try:
                return json.loads(v[0])
            except Exception:
                return []

        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []

        return v

class OrcamentoUpdate(BaseModel):
    cliente_id: Optional[str] = None
    data: Optional[str] = None
    dataEntrega: Optional[str] = None
    status: Optional[str] = None
    observacoes: Optional[str] = None
    arquivo: Optional[str] = None
    arquivoNome: Optional[str] = None
    introducao: Optional[str] = None
    materiaPrima: Optional[str] = None
    formaPagamento: Optional[str] = None
    itens: Optional[List[ItemOrcamentoCreate]] = None


class OrcamentoResponse(BaseModel):
    id: str
    cliente_id: str
    data: str
    dataEntrega: Optional[str] = ""
    status: str
    observacoes: Optional[str] = ""
    arquivo: Optional[str] = ""
    arquivoNome: Optional[str] = ""
    introducao: Optional[str] = ""
    materiaPrima: Optional[str] = ""
    formaPagamento: Optional[str] = ""
    criadoEm: str
    cliente: Optional[ClienteResponse] = None
    itens: List[ItemOrcamentoResponse] = []
    valorTotal: float = 0.0

    model_config = ConfigDict(from_attributes=True)
