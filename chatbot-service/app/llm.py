import os

import requests

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

SYSTEM_PROMPT = """Eres el asistente virtual del Hotel La Fragua. Ayudas con el proceso de reserva \
y preguntas sobre cómo funciona el sitio web, en español, de forma breve y amable.

No tienes información real sobre: ubicación exacta, atracciones turísticas cercanas, precios, \
disponibilidad de habitaciones, horarios de check-in/check-out, ni políticas del hotel (cancelación, \
mascotas, etc.). NUNCA inventes datos sobre estos temas, ni siquiera como ejemplo genérico.

Reglas estrictas:
- Si preguntan por precios, disponibilidad o fechas: responde que no tienes esa información aquí y \
sugiere escribir el tipo de habitación junto con las fechas exactas (dd/mm/aaaa) para consultar \
disponibilidad real.
- Si preguntan por ubicación, atracciones cercanas, horarios o políticas del hotel: responde \
honestamente que no tienes ese dato en este momento y sugiere contactar directamente al hotel, \
en vez de inventar un ejemplo o una respuesta genérica.
- Si la pregunta no tiene relación con el hotel, dilo amablemente y redirige la conversación hacia \
temas del hotel.
- Solo puedes hablar con seguridad sobre: qué es el hotel, cómo crear una cuenta, cómo buscar y \
reservar una habitación, y que existen servicios adicionales (sin inventar cuáles si no te los dan).
- Mantén las respuestas en 2-3 frases como máximo.
"""

RESPUESTA_DEGRADADA = (
    "No pude procesar tu pregunta en este momento. Intenta preguntar sobre horarios, "
    "tipos de habitación, servicios adicionales, o escribe el tipo de habitación y las "
    "fechas para consultar disponibilidad."
)


def responder_con_llm(mensaje: str, historial: list[dict] | None = None) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return RESPUESTA_DEGRADADA

    mensajes = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turno in (historial or [])[-6:]:
        rol = "assistant" if turno.get("rol") == "asistente" else "user"
        texto = turno.get("texto", "")
        if texto:
            mensajes.append({"role": rol, "content": texto})
    mensajes.append({"role": "user", "content": mensaje})

    try:
        response = requests.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": GROQ_MODEL,
                "messages": mensajes,
                "max_tokens": 300,
                "temperature": 0.4,
            },
            timeout=8,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except (requests.exceptions.RequestException, KeyError, IndexError):
        return RESPUESTA_DEGRADADA
