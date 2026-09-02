import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app

# Setup test database using in-memory SQLite with StaticPool
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# ==============================================================================
# CATEGORIA 1: HAPPY PATH (CAMINHO FELIZ)
# ==============================================================================


def test_1_1_cadastro_de_usuario_com_sucesso():
    payload = {
        "nome": "Marcenaria Silva Teste",
        "email": "contato@marcenariasilva.com.br",
        "senha": "SenhaValida@123",
        "razaoSocial": "Silva Marcenaria Ltda",
        "nomeFantasia": "Marcenaria Silva",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == "contato@marcenariasilva.com.br"
    assert "senha" not in data["user"]
    # Valida formato UUID v4 do ID do Usuário
    import re

    uuid4_regex = (
        r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    )
    assert re.match(uuid4_regex, data["user"]["id"], re.IGNORECASE) is not None


def test_1_2_login_de_usuario_com_sucesso():
    # Cadastra usuário
    client.post(
        "/api/auth/register",
        json={
            "nome": "Marceneiro Teste",
            "email": "login@marcenaria.com.br",
            "senha": "SenhaValida@123",
        },
    )

    # Realiza Login
    response = client.post(
        "/api/auth/login",
        json={"email": "login@marcenaria.com.br", "senha": "SenhaValida@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == "login@marcenaria.com.br"


def test_1_3_crud_completo_de_clientes():
    # Login para obter token
    reg = client.post(
        "/api/auth/register",
        json={
            "nome": "Marceneiro Admin",
            "email": "admin@marcenaria.com.br",
            "senha": "SenhaValida@123",
        },
    ).json()
    token = reg["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Criar Cliente
    novo_cli = client.post(
        "/api/clientes",
        headers=headers,
        json={
            "nome": "João da Silva",
            "celular": "(11) 99999-8888",
            "email": "joao@email.com",
            "apelido": "Joãozinho",
        },
    )
    assert novo_cli.status_code == 201
    cli_data = novo_cli.json()
    assert cli_data["nome"] == "João da Silva"
    cli_id = cli_data["id"]
    import re

    uuid4_regex = (
        r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    )
    assert re.match(uuid4_regex, cli_id, re.IGNORECASE) is not None

    # 2. Listar Clientes
    lista = client.get("/api/clientes", headers=headers)
    assert lista.status_code == 200
    assert len(lista.json()) == 1

    # 3. Atualizar Cliente
    upd = client.put(
        f"/api/clientes/{cli_id}", headers=headers, json={"nome": "João da Silva Sauro"}
    )
    assert upd.status_code == 200
    assert upd.json()["nome"] == "João da Silva Sauro"

    # 4. Deletar Cliente
    dele = client.delete(f"/api/clientes/{cli_id}", headers=headers)
    assert dele.status_code == 200
    assert (
        dele.json()["message"]
        == "Cliente e orçamentos vinculados removidos com sucesso."
    )


def test_1_4_crud_completo_de_orcamentos():
    reg = client.post(
        "/api/auth/register",
        json={
            "nome": "Marceneiro Admin 2",
            "email": "admin2@marcenaria.com.br",
            "senha": "SenhaValida@123",
        },
    ).json()
    headers = {"Authorization": f"Bearer {reg['token']}"}

    # Cria cliente para o orçamento
    cli = client.post(
        "/api/clientes",
        headers=headers,
        json={
            "nome": "Maria Santos",
            "celular": "(21) 98888-7777",
            "email": "maria@santos.com",
        },
    ).json()

    # 1. Criar Orçamento
    orc = client.post(
        "/api/orcamentos",
        headers=headers,
        json={
            "cliente_id": cli["id"],
            "data": "2026-08-01",
            "dataEntrega": "2026-08-20",
            "status": "Pendente",
            "observacoes": "Móvel sob medida para cozinha",
            "itens": [
                {
                    "servico": "Armário de Cozinha em MDF Naval",
                    "descricao": "Módulo superior de 2.40m com portas de vidro",
                    "local": "Cozinha Residencial",
                    "valor": 5500.00,
                }
            ],
        },
    )
    assert orc.status_code == 201
    orc_data = orc.json()
    assert orc_data["valorTotal"] == 5500.00
    assert len(orc_data["itens"]) == 1
    orc_id = orc_data["id"]

    # 2. Buscar por ID
    get_orc = client.get(f"/api/orcamentos/{orc_id}", headers=headers)
    assert get_orc.status_code == 200
    assert get_orc.json()["id"] == orc_id

    # 3. Deletar Orçamento
    del_orc = client.delete(f"/api/orcamentos/{orc_id}", headers=headers)
    assert del_orc.status_code == 200


# ==============================================================================
# CATEGORIA 2: EDGE CASES (CASOS DE BORDA / TRATAMENTO DE ERROS)
# ==============================================================================


def test_2_1_rejeita_cadastro_com_senha_fraca():
    response = client.post(
        "/api/auth/register",
        json={
            "nome": "Usuario Fraco",
            "email": "fraco@marcenaria.com.br",
            "senha": "senha",  # Menos de 8 caracteres e sem maiúsculas/especiais
        },
    )
    assert response.status_code == 400
    assert "A senha deve conter no mínimo 8 caracteres" in response.json()["error"]


def test_2_2_rejeita_cadastro_de_email_duplicado():
    payload = {
        "nome": "Usuario Original",
        "email": "duplicado@marcenaria.com.br",
        "senha": "SenhaSegura@123",
    }
    client.post("/api/auth/register", json=payload)

    # Tenta cadastrar novamente com o mesmo e-mail
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert "Este e-mail já está cadastrado no sistema." in response.json()["error"]


def test_2_3_rejeita_login_com_credenciais_invalidas():
    response = client.post(
        "/api/auth/login",
        json={"email": "naoexiste@marcenaria.com.br", "senha": "SenhaSegura@123"},
    )
    assert response.status_code == 401
    assert "E-mail ou senha incorretos." in response.json()["error"]


def test_2_4_retorna_404_ao_buscar_recursos_inexistentes():
    reg = client.post(
        "/api/auth/register",
        json={
            "nome": "Marceneiro Teste 404",
            "email": "m404@marcenaria.com.br",
            "senha": "SenhaValida@123",
        },
    ).json()
    headers = {"Authorization": f"Bearer {reg['token']}"}

    res_cli = client.put(
        "/api/clientes/CLI-INEXISTENTE", headers=headers, json={"nome": "Teste"}
    )
    assert res_cli.status_code == 404

    res_orc = client.get("/api/orcamentos/ORC-INEXISTENTE", headers=headers)
    assert res_orc.status_code == 404


# ==============================================================================
# CATEGORIA 3: SECURITY VULNERABILITIES (SEGURANÇA & AUTENTICAÇÃO)
# ==============================================================================


def test_3_1_bloqueia_acesso_a_rotas_protegidas_sem_token():
    # Tenta listar clientes sem Header de Autorização
    res_cli = client.get("/api/clientes")
    assert res_cli.status_code == 401
    assert (
        "Acesso negado. Token de autenticação não fornecido." in res_cli.json()["error"]
    )

    # Tenta criar orçamento sem Token
    res_orc = client.post(
        "/api/orcamentos", json={"cliente_id": "CLI-1", "data": "2026-08-01"}
    )
    assert res_orc.status_code == 401


def test_3_2_bloqueia_acesso_com_token_invalido_ou_forjado():
    headers = {"Authorization": "Bearer token.invalid.forjado"}
    response = client.get("/api/clientes", headers=headers)
    assert response.status_code == 401
    assert "Token de autenticação inválido." in response.json()["error"]


def test_3_3_nao_expoe_senhas_nos_endpoints_de_usuario():
    reg = client.post(
        "/api/auth/register",
        json={
            "nome": "Usuario Sem Exposição",
            "email": "seguro@marcenaria.com.br",
            "senha": "SenhaSuperSegura@123",
        },
    ).json()

    user_data = reg["user"]
    assert "senha" not in user_data
    assert "password" not in user_data


def test_3_4_prometheus_metrics_endpoint_retorna_metricas_validas():
    # Realiza requisição para a rota /metrics sem autenticação
    response = client.get("/metrics")
    assert response.status_code == 200
    assert (
        "text/plain" in response.headers["content-type"]
        or "version=0.0.4" in response.headers["content-type"]
    )

    body = response.text
    # Verifica presença das métricas customizadas do Prometheus
    assert "http_requests_total" in body
    assert "http_request_duration_seconds" in body
    assert "db_operations_total" in body
    assert "db_operation_duration_seconds" in body


def test_3_5_upload_e_gestao_de_arquivos_no_servico_de_storage():
    reg = client.post(
        "/api/auth/register",
        json={
            "nome": "Usuario Arquivos",
            "email": "arquivos@marcenaria.com.br",
            "senha": "SenhaValida@123",
        },
    ).json()
    headers = {"Authorization": f"Bearer {reg['token']}"}

    # 1. Upload de Arquivo via JSON Base64
    upload_res = client.post(
        "/api/files/upload",
        headers=headers,
        json={
            "filename": "planta_cozinha.pdf",
            "content_type": "application/pdf",
            "base64_data": "SGVsbG8gTWFyY2VuYXJpYSBTdG9yYWdl",
        },
    )
    assert upload_res.status_code == 200
    file_data = upload_res.json()
    assert "id" in file_data
    assert file_data["filename"] == "planta_cozinha.pdf"
    file_id = file_data["id"]

    # 2. Listagem de Arquivos
    files_list = client.get("/api/files", headers=headers)
    assert files_list.status_code == 200
    assert any(f["id"] == file_id for f in files_list.json())

    # 3. Download/Download de Arquivo por ID
    get_file_res = client.get(f"/api/files/{file_id}")
    assert get_file_res.status_code == 200
    assert get_file_res.content == b"Hello Marcenaria Storage"

    # 4. Remoção de Arquivo
    del_res = client.delete(f"/api/files/{file_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["message"] == "Arquivo removido com sucesso."


def test_3_6_sanitizacao_de_dados_sensiveis_nos_logs():
    from backend.metrics import sanitize_data

    dados_sensiveis = {
        "nome": "Cliente Teste",
        "senha": "MinhaSenhaSuperSecreta!123",
        "email": "teste@email.com",
        "cpf": "123.456.789-00",
        "cnpj": "12.345.678/0001-90",
        "telefone": "(11) 99999-8888",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.12345",
    }
    sanitizado = sanitize_data(dados_sensiveis)
    assert sanitizado["nome"] == "Cliente Teste"
    assert sanitizado["senha"] == "[REDACTED]"
    assert sanitizado["email"] == "[REDACTED]"
    assert sanitizado["cpf"] == "[REDACTED]"
    assert sanitizado["cnpj"] == "[REDACTED]"
    assert sanitizado["telefone"] == "[REDACTED]"
    assert sanitizado["token"] == "[REDACTED]"
