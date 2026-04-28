from pydantic import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Config(BaseSettings):
    MYSQL_USER: str
    MYSQL_PASSWORD: str
    MYSQL_HOST: str
    MYSQL_PORT: int
    MYSQL_DB: str
    SECRET_KEY: str

    class Config:
        env_file = BASE_DIR / ".env"
        extra = "allow"

# Cargar configuración
settings = Config()