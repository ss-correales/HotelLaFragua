import os
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SERVICE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(SERVICE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def _is_auth_enabled() -> bool:
    return os.getenv("AUTH_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}


def _get_secret_key() -> str:
    if not SECRET_KEY:
        raise RuntimeError("SECRET_KEY no está configurado en las variables de entorno")
    return SECRET_KEY


def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, _get_secret_key(), algorithm=ALGORITHM)

def verify_token(
    token: str | None = None,
    credentials: HTTPAuthorizationCredentials | None = Depends(security)
):
    """Valida un JWT y retorna los datos del usuario"""
    if not _is_auth_enabled():
        return {"sub": "auth-disabled"}

    if token is None and credentials is not None:
        token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, _get_secret_key(), algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_admin(payload: dict = Depends(verify_token)):
    """
    Exige que el usuario autenticado tenga el rol Administrador.
    Se usa igual que verify_token, pero además valida el rol:

        @router.post("/roles")
        def crear_rol(..., current_user = Depends(require_admin)):
            ...
    """
    if not _is_auth_enabled():
        return payload

    roles = payload.get("roles", [])
    if "Administrador" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requiere rol de Administrador",
        )
    return payload
