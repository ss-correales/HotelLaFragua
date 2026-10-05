import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
REMITENTE_NOMBRE = os.getenv("REMITENTE_NOMBRE", "Hotel La Fragua")


def enviar_correo(destinatario: str, asunto: str, html: str) -> bool:
    """Envia un correo via Gmail SMTP. Nunca lanza excepcion: devuelve False si
    algo falla, para que un correo caido no tumbe el registro o la reserva que lo disparan."""
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        return False

    mensaje = MIMEMultipart("alternative")
    mensaje["Subject"] = asunto
    mensaje["From"] = f"{REMITENTE_NOMBRE} <{GMAIL_USER}>"
    mensaje["To"] = destinatario
    mensaje.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as servidor:
            servidor.starttls()
            servidor.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            servidor.sendmail(GMAIL_USER, destinatario, mensaje.as_string())
        return True
    except (smtplib.SMTPException, OSError):
        return False
