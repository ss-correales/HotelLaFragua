import os

os.environ["DATABASE_URL"] = "sqlite:///./test_auth.db"
os.environ["AUTH_ENABLED"] = "false"
os.environ["SECRET_KEY"] = "clave-de-prueba-no-usar-en-produccion"

from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app

client = TestClient(app)


def setup_module():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def teardown_module():
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test_auth.db"):
        os.remove("test_auth.db")


def _registrar(correo="camino.feliz@correo.com", nombre_usuario="camino.feliz"):
    return client.post("/auth/register", json={
        "nombre_usuario": nombre_usuario,
        "correo": correo,
        "numero_documento": 1000001,
        "contraseña": "clave12345",
        "roles": [],
    })


def test_registro_exitoso():
    respuesta = _registrar()
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["correo"] == "camino.feliz@correo.com"
    assert cuerpo["nombre_usuario"] == "camino.feliz"
    assert cuerpo["estado"] is True


def test_registro_con_correo_duplicado_falla():
    primera = _registrar(correo="duplicado@correo.com", nombre_usuario="usuario.uno")
    assert primera.status_code == 200

    segunda = _registrar(correo="duplicado@correo.com", nombre_usuario="usuario.dos")
    assert segunda.status_code == 400


def test_login_exitoso_devuelve_token():
    _registrar(correo="login.ok@correo.com", nombre_usuario="login.ok")

    respuesta = client.post("/auth/login", json={
        "correo": "login.ok@correo.com",
        "contraseña": "clave12345",
    })

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert "access_token" in cuerpo
    assert cuerpo["token_type"] == "bearer"


def test_login_con_password_incorrecta_falla():
    _registrar(correo="login.mal@correo.com", nombre_usuario="login.mal")

    respuesta = client.post("/auth/login", json={
        "correo": "login.mal@correo.com",
        "contraseña": "esta-no-es-la-clave",
    })

    assert respuesta.status_code == 401


def test_login_con_correo_inexistente_falla():
    respuesta = client.post("/auth/login", json={
        "correo": "no.existo@correo.com",
        "contraseña": "lo-que-sea",
    })

    assert respuesta.status_code == 401


def test_google_con_token_invalido_da_401(monkeypatch):
    # No probamos contra Google de verdad: simulamos que el token que manda
    # el frontend es invalido, que es el caso que SI podemos reproducir sin
    # depender de una cuenta de Google real.
    from fastapi import HTTPException

    def _verificar_falso(credential):
        raise HTTPException(status_code=401, detail="Token de Google inválido")

    monkeypatch.setattr("app.routers.auth.verificar_id_token_google", _verificar_falso)

    respuesta = client.post("/auth/google", json={"credential": "token-falso"})
    assert respuesta.status_code == 401
