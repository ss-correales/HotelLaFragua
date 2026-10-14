import os

os.environ["AUTH_ENABLED"] = "false"
os.environ.pop("GMAIL_USER", None)
os.environ.pop("GMAIL_APP_PASSWORD", None)

from fastapi.testclient import TestClient

from app.email import enviar_correo
from app.main import app
from app.plantillas import correo_bienvenida, correo_confirmacion_reserva

client = TestClient(app)


def test_plantilla_bienvenida_incluye_el_nombre():
    asunto, html = correo_bienvenida("Camila")
    assert "Bienvenido" in asunto
    assert "Camila" in html


def test_plantilla_confirmacion_reserva_incluye_los_datos():
    asunto, html = correo_confirmacion_reserva("Camila", "Suite", "2026-12-10", "2026-12-15", 450000)
    assert "Suite" in html
    assert "2026-12-10" in html
    assert "450,000" in html or "450000" in html


def test_enviar_correo_sin_credenciales_devuelve_false_sin_lanzar_excepcion():
    # Asi esta hoy en el .env real: sin GMAIL_USER/GMAIL_APP_PASSWORD. El resto
    # del sistema depende de que esto NUNCA lance una excepcion (ver auth-service
    # y reservas-service, que disparan el correo sin esperar su resultado).
    resultado = enviar_correo("destino@correo.com", "Asunto", "<p>hola</p>")
    assert resultado is False


def test_endpoint_bienvenida_responde_enviado_false_sin_credenciales():
    respuesta = client.post("/notificaciones/bienvenida", json={"correo": "test@correo.com", "nombre": "Camila"})
    assert respuesta.status_code == 200
    assert respuesta.json()["enviado"] is False


def test_endpoint_confirmacion_reserva_responde_bien_formado():
    respuesta = client.post("/notificaciones/confirmacion-reserva", json={
        "correo": "test@correo.com",
        "nombre": "Camila",
        "tipo_habitacion": "Doble",
        "fecha_inicio": "2026-12-10",
        "fecha_fin": "2026-12-15",
        "total": 300000,
    })
    assert respuesta.status_code == 200
    assert "enviado" in respuesta.json()
