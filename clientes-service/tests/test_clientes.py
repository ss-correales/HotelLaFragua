import os

os.environ["DATABASE_URL"] = "sqlite:///./test_clientes.db"
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
    if os.path.exists("test_clientes.db"):
        os.remove("test_clientes.db")


def _payload(numero_documento="1000001", correo="cliente.prueba@correo.com"):
    return {
        "nombre": "Camino",
        "apellido": "Feliz",
        "tipo_documento": "CC",
        "numero_documento": numero_documento,
        "correo": correo,
        "telefono": "3001234567",
    }


def test_crud_cliente():
    crear = client.post("/clientes/", json=_payload())
    assert crear.status_code == 200
    cliente_creado = crear.json()
    assert cliente_creado["nombre"] == "Camino"
    id_cliente = cliente_creado["id_cliente"]

    listar = client.get("/clientes/")
    assert listar.status_code == 200
    assert any(c["id_cliente"] == id_cliente for c in listar.json())

    por_documento = client.get("/clientes/documento/1000001")
    assert por_documento.status_code == 200
    assert por_documento.json()["correo"] == "cliente.prueba@correo.com"

    por_correo = client.get("/clientes/correo/cliente.prueba@correo.com")
    assert por_correo.status_code == 200
    assert por_correo.json()["numero_documento"] == "1000001"

    actualizar = client.put(f"/clientes/{id_cliente}", json={"telefono": "3009999999"})
    assert actualizar.status_code == 200
    assert actualizar.json()["telefono"] == "3009999999"

    eliminar = client.delete(f"/clientes/{id_cliente}")
    assert eliminar.status_code == 200


def test_crear_cliente_con_documento_duplicado_falla():
    primero = client.post("/clientes/", json=_payload(numero_documento="2000002", correo="uno@correo.com"))
    assert primero.status_code == 200

    segundo = client.post("/clientes/", json=_payload(numero_documento="2000002", correo="dos@correo.com"))
    assert segundo.status_code == 400


def test_obtener_cliente_inexistente_da_404():
    respuesta = client.get("/clientes/documento/no-existe")
    assert respuesta.status_code == 404
