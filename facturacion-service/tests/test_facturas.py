import os

os.environ["DATABASE_URL"] = "sqlite:///./test_facturas.db"
os.environ["AUTH_ENABLED"] = "false"

from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app

client = TestClient(app)


def setup_module():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def teardown_module():
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test_facturas.db"):
        os.remove("test_facturas.db")


def test_root():
    respuesta = client.get("/")
    assert respuesta.status_code == 200


def test_crear_factura_y_listarla():
    crear = client.post("/facturas/", json={"id_reserva": 1, "total": 150000, "estado": "pendiente"})
    assert crear.status_code == 200
    factura = crear.json()
    assert factura["estado"] == "pendiente"
    id_factura = factura["id_factura"]

    listar = client.get("/facturas/")
    assert listar.status_code == 200
    assert any(f["id_factura"] == id_factura for f in listar.json())

    obtener = client.get(f"/facturas/{id_factura}")
    assert obtener.status_code == 200

    por_reserva = client.get("/facturas/reserva/1")
    assert por_reserva.status_code == 200
    assert len(por_reserva.json()) >= 1


def test_registrar_pago_marca_la_factura_como_pagada():
    crear = client.post("/facturas/", json={"id_reserva": 2, "total": 90000, "estado": "pendiente"})
    id_factura = crear.json()["id_factura"]

    pago = client.post(f"/facturas/{id_factura}/pagos", json={"metodo_pago": "efectivo", "monto": 90000})
    assert pago.status_code == 200

    factura_actualizada = client.get(f"/facturas/{id_factura}")
    assert factura_actualizada.json()["estado"] == "pagada"

    listar_pagos = client.get(f"/facturas/{id_factura}/pagos")
    assert listar_pagos.status_code == 200
    assert len(listar_pagos.json()) == 1


def test_pagar_factura_ya_pagada_falla():
    crear = client.post("/facturas/", json={"id_reserva": 3, "total": 50000, "estado": "pendiente"})
    id_factura = crear.json()["id_factura"]
    client.post(f"/facturas/{id_factura}/pagos", json={"metodo_pago": "efectivo", "monto": 50000})

    segundo_pago = client.post(f"/facturas/{id_factura}/pagos", json={"metodo_pago": "efectivo", "monto": 50000})
    assert segundo_pago.status_code == 400


def test_obtener_factura_inexistente_da_404():
    respuesta = client.get("/facturas/9999")
    assert respuesta.status_code == 404
