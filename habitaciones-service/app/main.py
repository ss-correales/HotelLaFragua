import os
import json
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from . import models
from .database import engine
from .routers import habitaciones
from .crud import job_liberar_habitaciones_limpieza

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SERVICE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(SERVICE_DIR / ".env")


def get_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "*").strip()
    if raw_origins == "*":
        return ["*"]
    if raw_origins.startswith("["):
        return [origin.strip() for origin in json.loads(raw_origins) if origin.strip()]
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Habitaciones Service"
)

# Configurar seguridad para Swagger
security = HTTPBearer()

# Configurar esquema de seguridad para Swagger
app.openapi_components = {
    "securitySchemes": {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
}

# Aplicar seguridad global a todos los endpoints
app.openapi_security = [{"BearerAuth": []}]
cors_origins = get_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = BackgroundScheduler()
scheduler.add_job(job_liberar_habitaciones_limpieza, "interval", minutes=1)
scheduler.start()

app.include_router(habitaciones.router)

@app.get("/")
def root():
    return {"status": "Habitaciones microservice funcionando correctamente"}
