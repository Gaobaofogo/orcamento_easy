import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os


class Settings:
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "Orçamento Easy")

settings = Settings()

def enviar_email_recuperacao(email_destino: str, link_recuperacao: str):
    """
    Envia o e-mail contendo o link com token de recuperação de senha.
    """
    # 1. Montagem da Mensagem
    mensagem = MIMEMultipart("alternative")
    mensagem["Subject"] = "Recuperação de Senha"
    mensagem["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    mensagem["To"] = email_destino

    # Conteúdo em Texto Puro
    texto_plano = (
        f"Olá!\n\n"
        f"Recebemos uma solicitação para redefinir sua senha.\n"
        f"Clique no link abaixo para alterar sua senha (válido por 15 minutos):\n"
        f"{link_recuperacao}\n\n"
        f"Se você não solicitou essa alteração, ignore este e-mail."
    )

    # Conteúdo em HTML (melhor apresentação)
    texto_html = f"""
    <html>
      <body>
        <h3>Recuperação de Senha</h3>
        <p>Olá!</p>
        <p>Recebemos uma solicitação para redefinir a sua senha no <strong>Orçamento Easy</strong>.</p>
        <p>Clique no botão abaixo para redefinir sua senha (válido por 15 minutos):</p>
        <p>
          <a href="{link_recuperacao}" 
             style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
             Redefinir Senha
          </a>
        </p>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p><a href="{link_recuperacao}">{link_recuperacao}</a></p>
        <br>
        <p><small>Se você não solicitou esta alteração, por favor ignore este e-mail.</small></p>
      </body>
    </html>
    """

    mensagem.attach(MIMEText(texto_plano, "plain", "utf-8"))
    mensagem.attach(MIMEText(texto_html, "html", "utf-8"))

    # 2. Conexão e Envio via SMTP
    try:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.MAIL_FROM, email_destino, mensagem.as_string())
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")
        raise e
