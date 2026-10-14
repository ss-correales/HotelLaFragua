import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite:///./test_reservas.db"
os.environ["AUTH_ENABLED"] = "false"
os.environ["SECRET_KEY"] = "clave-de-prueba-no-usar-en-produccion"

import pytest
from fastapi.testclient import TestClient

from app import crud
from app.database import Base, engine
from app.main import app

client = TestClient(app)

MAÑANA = date.today() + timedelta(days=1)
PASADO_MAÑANA = date.today() + timedelta(days=3)


def setup_module():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def teardown_module():
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test_reservas.db"):
        os.remove("test_reservas.db")


@pytest.fixture(autouse=True)
def simular_otros_servicios(monkeypatch):
    """reservas-service le pregunta por HTTP a clientes-service, habitaciones-service
    y facturacion-service — como no estan corriendo en el test, simulamos sus
    respuestas para poder probar reservas-service de forma aislada."""
    monkeypatch.setattr(crud, "verificar_cliente", lambda id_cliente, auth_header=None: True)
    monkeypatch.setattr(
        crud,
        "obtener_habitaciones_por_tipo",
        lambda tipo_habitacion: [
            {"tipo_habitacion": tipo_habitacion, "precio_base": 90000, "ocupacion": 3, "estado": "Libre"}
        ],
    )
    monkeypatch.setattr(crud, "generar_factura", lambda id_reserva, total: None)
    monkeypatch.setattr(crud, "_notificar_confirmacion_reserva", lambda *a, **k: None)


def _payload_reserva(tipo_habitacion="Doble"):
    return {
        "identificacion_cliente": 123456,
        "tipo_habitacion": tipo_habitacion,
        "fecha_inicio": MAÑANA.isoformat(),
        "fecha_fin": PASADO_MAÑANA.isoformat(),
        "adultos": 2,
        "ninos": 0,
        "bebes": 0,
        "servicios_adicionales": [],
    }


def test_crear_reserva_camino_feliz():
    respuesta = client.post("/reservas/", json=_payload_reserva())
    assert respuesta.status_code == 200
    reserva = respuesta.json()
    assert reserva["estado"] == "Pendiente"
    assert reserva["canal"] == "Online"
    assert reserva["tipo_habitacion"] == "Doble"


def test_crear_reserva_con_fecha_fin_antes_de_inicio_falla():
    payload = _payload_reserva()
    payload["fecha_inicio"], payload["fecha_fin"] = payload["fecha_fin"], payload["fecha_inicio"]

    respuesta = client.post("/reservas/", json=payload)
    assert respuesta.status_code == 400


def test_crear_reserva_tipo_habitacion_sin_inventario_falla(monkeypatch):
    monkeypatch.setattr(crud, "obtener_habitaciones_por_tipo", lambda tipo_habitacion: [])

    respuesta = client.post("/reservas/", json=_payload_reserva())
    assert respuesta.status_code == 400


def test_listar_servicios_adicionales():
    respuesta = client.get("/reservas/servicios-adicionales")
    assert respuesta.status_code == 200
    nombres = [s["nombre"] for s in respuesta.json()]
    assert "Acceso a spa" in nombres


def test_disponibilidad_sin_reservas_previas():
    respuesta = client.get("/reservas/disponibles", params={
        "tipo_habitacion": "Suite",
        "fecha_inicio": MAÑANA.isoformat(),
        "fecha_fin": PASADO_MAÑANA.isoformat(),
    })
    assert respuesta.status_code == 200
    # el mock de obtener_habitaciones_por_tipo siempre devuelve 1 habitacion libre
    assert respuesta.json()["disponibles"] == 1
