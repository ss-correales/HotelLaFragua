import os

os.environ["DATABASE_URL"] = "sqlite:///./test_empleados.db"
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
    if os.path.exists("test_empleados.db"):
        os.remove("test_empleados.db")


def _payload(documento="E001"):
    return {
        "nombre": "Camino",
        "apellido": "Feliz",
        "documento": documento,
        "cargo": "Recepcionista",
        "email": "empleado.prueba@hotel.com",
        "telefono": "3001112222",
        "estado": "activo",
    }


def test_crud_empleado():
    crear = client.post("/empleados/", json=_payload())
    assert crear.status_code == 200
    empleado = crear.json()
    assert empleado["nombre"] == "Camino"
    id_empleado = empleado["id_empleado"]

    listar = client.get("/empleados/")
    assert listar.status_code == 200
    assert any(e["id_empleado"] == id_empleado for e in listar.json())

    obtener = client.get(f"/empleados/{id_empleado}")
    assert obtener.status_code == 200
    assert obtener.json()["cargo"] == "Recepcionista"

    actualizar_payload = _payload(documento="E001")
    actualizar_payload["cargo"] = "Supervisor"
    actualizar = client.put(f"/empleados/{id_empleado}", json=actualizar_payload)
    assert actualizar.status_code == 200
    assert actualizar.json()["cargo"] == "Supervisor"

    eliminar = client.delete(f"/empleados/{id_empleado}")
    assert eliminar.status_code == 200


def test_obtener_empleado_inexistente_da_404():
    respuesta = client.get("/empleados/9999")
    assert respuesta.status_code == 404
