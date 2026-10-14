import os
import json
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from dotenv import load_dotenv
from .database import engine, Base
from .routers import auth
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .limiter import limiter


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


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Auth Service")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
cors_origins = get_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "Auth Service activo"}
