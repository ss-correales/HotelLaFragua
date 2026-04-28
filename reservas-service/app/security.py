import os
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "hotel_lafragua_123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "hotel_lafragua_internal")


def _is_auth_enabled() -> bool:
    return os.getenv("AUTH_ENABLED", "true").strip().lower() in {"1", "true", "yes", "on"}

# Configurar HTTPBearer para Swagger UI
security = HTTPBearer(auto_error=False)

def verify_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
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

    if request.headers.get("X-Internal-Token") == INTERNAL_SERVICE_TOKEN:
        return "internal-service"

    try:
        if credentials is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token requerido",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
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
