import os

os.environ["DATABASE_URL"] = "sqlite:///./test_habitaciones.db"
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
    if os.path.exists("test_habitaciones.db"):
        os.remove("test_habitaciones.db")


def test_root():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "Habitaciones microservice funcionando correctamente"


def test_crud_habitacion():
    payload = {
        "numero_habitacion": 101,
        "tipo_habitacion": "Doble",
        "descripcion": "Habitacion de prueba",
        "ocupacion": 2,
        "numero_camas": 1,
        "precio_base": 120000,
        "estado": "Libre",
        "comodidades": ["WiFi", "TV"],
        "foto": None,
    }

    create_response = client.post("/api/habitaciones", json=payload)
    assert create_response.status_code == 200
    assert create_response.json()["numero_habitacion"] == 101

    list_response = client.get("/api/habitaciones")
    assert list_response.status_code == 200
    assert any(h["numero_habitacion"] == 101 for h in list_response.json())

    update_response = client.put("/api/habitaciones/101", json={"estado": "Ocupada"})
    assert update_response.status_code == 200
    assert update_response.json()["estado"] == "Ocupada"

    delete_response = client.delete("/api/habitaciones/101")
    assert delete_response.status_code == 200
    assert delete_response.json()["mensaje"] == "Habitación eliminada"
