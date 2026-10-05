import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import notificaciones

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


app = FastAPI(title="Notificaciones Service")
cors_origins = get_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notificaciones.router)


@app.get("/")
def root():
    return {"message": "Notificaciones Service activo"}
