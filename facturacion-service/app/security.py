import os
from pathlib import Path
from dotenv import load_dotenv
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

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


# Configurar HTTPBearer para Swagger UI
security = HTTPBearer(auto_error=False)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Valida el token JWT usando HTTPBearer.
    Se usa como dependencia en los endpoints protegidos.

    Uso:
        @router.get("/ruta")
        def mi_endpoint(current_user = Depends(verify_token)):
            return {"user": current_user}
    """
    if not _is_auth_enabled():
        return "auth-disabled"

    try:
        if credentials is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token requerido",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = credentials.credentials
        payload = jwt.decode(token, _get_secret_key(), algorithms=[ALGORITHM])
        user_identity = payload.get("sub") or payload.get("nombre_usuario") or payload.get("correo")
        if user_identity is None and payload.get("id_usuario") is not None:
            user_identity = str(payload.get("id_usuario"))

        if user_identity is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_identity
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
