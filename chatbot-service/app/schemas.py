from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    mensaje: str = Field(..., min_length=1, max_length=500)
    historial: list[dict] | None = None  # [{"rol": "usuario"|"asistente", "texto": "..."}]


class ChatResponse(BaseModel):
    respuesta: str
    fuente: str  # "disponibilidad" | "regla" | "llm"
