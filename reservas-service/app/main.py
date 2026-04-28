import json
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.security import HTTPBearer
from .database import engine, Base
from apscheduler.schedulers.background import BackgroundScheduler
from .routers import reservas
from .crud import actualizar_reservas_vencidas
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Reservas Service"
)


def get_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "")
    if not raw_origins:
        return ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"]

    try:
        origins = json.loads(raw_origins)
        if isinstance(origins, list) and origins:
            return origins
    except json.JSONDecodeError:
        pass

    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
scheduler = BackgroundScheduler()
scheduler.add_job(actualizar_reservas_vencidas, "interval", minutes=30)
scheduler.start()
app.include_router(reservas.router)

@app.get("/")
def root():
    return {"message": "Reservas Service activo"}
