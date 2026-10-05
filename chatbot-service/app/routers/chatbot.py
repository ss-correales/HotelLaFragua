from fastapi import APIRouter, HTTPException

from .. import schemas
from ..disponibilidad import intentar_disponibilidad
from ..faq import buscar_respuesta_faq
from ..llm import responder_con_llm

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


@router.post("/mensaje", response_model=schemas.ChatResponse)
def responder_mensaje(payload: schemas.ChatRequest):
    mensaje = payload.mensaje.strip()
    if not mensaje:
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

    respuesta = intentar_disponibilidad(mensaje)
    if respuesta:
        return schemas.ChatResponse(respuesta=respuesta, fuente="disponibilidad")

    respuesta = buscar_respuesta_faq(mensaje)
    if respuesta:
        return schemas.ChatResponse(respuesta=respuesta, fuente="regla")

    respuesta = responder_con_llm(mensaje, payload.historial)
    return schemas.ChatResponse(respuesta=respuesta, fuente="llm")
