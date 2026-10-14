import os
from datetime import date, timedelta

os.environ["AUTH_ENABLED"] = "false"

import pytest
from fastapi.testclient import TestClient

from app.faq import buscar_respuesta_faq
from app.disponibilidad import intentar_disponibilidad
from app.main import app

client = TestClient(app)

MAÑANA = date.today() + timedelta(days=1)
PASADO_MAÑANA = date.today() + timedelta(days=3)


class _RespuestaFalsa:
    def __init__(self, status_code, data):
        self.status_code = status_code
        self._data = data

    def raise_for_status(self):
        if self.status_code >= 400:
            raise Exception(f"status {self.status_code}")

    def json(self):
        return self._data


def test_faq_checkin_responde_sin_llamar_a_otro_servicio():
    respuesta = buscar_respuesta_faq("a que hora es el check-in?")
    assert respuesta is not None
    assert "check-in" in respuesta.lower() or "3:00" in respuesta


def test_faq_pregunta_desconocida_devuelve_none():
    assert buscar_respuesta_faq("cual es el sentido de la vida?") is None


def test_faq_tipos_habitacion_consulta_habitaciones_service(monkeypatch):
    def get_falso(url, *args, **kwargs):
        return _RespuestaFalsa(200, [
            {"tipo_habitacion": "Doble", "precio_base": 90000},
            {"tipo_habitacion": "Suite", "precio_base": 150000},
        ])

    monkeypatch.setattr("requests.get", get_falso)

    respuesta = buscar_respuesta_faq("que tipos de habitacion tienen?")
    assert "Doble" in respuesta
    assert "Suite" in respuesta


def test_disponibilidad_sin_tipo_ni_fechas_devuelve_none():
    assert intentar_disponibilidad("hola, buenos dias") is None


def test_disponibilidad_con_tipo_y_fechas_consulta_reservas_service(monkeypatch):
    def get_falso(url, *args, **kwargs):
        return _RespuestaFalsa(200, {"disponibles": 2})

    monkeypatch.setattr("requests.get", get_falso)

    mensaje = f"tienen suite libre del {MAÑANA.strftime('%d/%m/%Y')} al {PASADO_MAÑANA.strftime('%d/%m/%Y')}?"
    respuesta = intentar_disponibilidad(mensaje)
    assert respuesta is not None
    assert "2 habitación" in respuesta


def test_endpoint_mensaje_vacio_da_400():
    respuesta = client.post("/chatbot/mensaje", json={"mensaje": "   "})
    assert respuesta.status_code == 400


def test_endpoint_responde_regla_faq():
    respuesta = client.post("/chatbot/mensaje", json={"mensaje": "como reservo una habitacion?"})
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["fuente"] == "regla"


def test_endpoint_sin_groq_api_key_degrada_sin_romperse(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)

    respuesta = client.post("/chatbot/mensaje", json={"mensaje": "hola, que tal el clima?"})
    assert respuesta.status_code == 200
    assert respuesta.json()["fuente"] == "llm"
