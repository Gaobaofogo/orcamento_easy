import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)
    razaoSocial = Column(String, nullable=True, default="")
    nomeFantasia = Column(String, nullable=True, default="")
    endereco = Column(String, nullable=True, default="")
    telefone = Column(String, nullable=True, default="")
    cnpj = Column(String, nullable=True, default="")
    logomarca = Column(Text, nullable=True, default="")
    introducao = Column(Text, nullable=True, default="")
    materiaPrima = Column(Text, nullable=True, default="")
    formaPagamento = Column(Text, nullable=True, default="")


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    nome = Column(String, nullable=False)
    celular = Column(String, nullable=False)
    email = Column(String, nullable=False)
    apelido = Column(String, nullable=False)
    criadoEm = Column(String, nullable=False)

    orcamentos = relationship(
        "Orcamento", back_populates="cliente", cascade="all, delete-orphan"
    )


class Orcamento(Base):
    __tablename__ = "orcamentos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    cliente_id = Column(
        String, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False
    )
    data = Column(String, nullable=False)
    dataEntrega = Column(String, nullable=True, default="")
    status = Column(String, nullable=False, default="Pendente")
    observacoes = Column(String, nullable=True, default="")
    arquivoId = Column(String, nullable=True, default="")
    arquivoNome = Column(String, nullable=True, default="")
    introducao = Column(Text, nullable=True, default="")
    materiaPrima = Column(Text, nullable=True, default="")
    formaPagamento = Column(Text, nullable=True, default="")
    criadoEm = Column(String, nullable=False)

    cliente = relationship("Cliente", back_populates="orcamentos")
    itens = relationship(
        "ItemOrcamento", back_populates="orcamento", cascade="all, delete-orphan"
    )


class ItemOrcamento(Base):
    __tablename__ = "itens_orcamento"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    orcamento_id = Column(
        String, ForeignKey("orcamentos.id", ondelete="CASCADE"), nullable=False
    )
    servico = Column(String, nullable=False)
    descricao = Column(Text, nullable=True, default="")
    local = Column(String, nullable=False)
    valor = Column(Float, nullable=False, default=0.0)

    orcamento = relationship("Orcamento", back_populates="itens")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    token = Column(
        String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    email = Column(String, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
