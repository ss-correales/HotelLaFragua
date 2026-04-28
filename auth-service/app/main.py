import json
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from .database import engine, Base
from .routers import auth
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Auth Service")


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "Auth Service activo"}
