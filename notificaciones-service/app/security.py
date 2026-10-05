import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SERVICE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(SERVICE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def _is_auth_enabled() -> bool:
    return os.getenv("AUTH_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}


def _get_secret_key() -> str:
    if not SECRET_KEY:
        raise RuntimeError("SECRET_KEY no está configurado en las variables de entorno")
    return SECRET_KEY


security = HTTPBearer(auto_error=False)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Este servicio solo lo llaman otros servicios internos (auth-service,
    reservas-service), nunca el navegador directamente — por eso basta con
    exigir cualquier JWT valido del mismo SECRET_KEY compartido."""
    if not _is_auth_enabled():
        return "auth-disabled"
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return jwt.decode(credentials.credentials, _get_secret_key(), algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
