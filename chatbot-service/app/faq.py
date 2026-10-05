import os
import unicodedata

import requests


def _normalizar(texto: str) -> str:
    """Minusculas y sin tildes, para que 'habitación' y 'habitacion' matcheen igual."""
    sin_tildes = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return sin_tildes.lower()

HABITACIONES_SERVICE_URL = os.getenv("HABITACIONES_SERVICE_URL", "http://localhost:8082")
RESERVAS_SERVICE_URL = os.getenv("RESERVAS_SERVICE_URL", "http://localhost:8083")


def _listar_tipos_habitacion() -> str:
    try:
        response = requests.get(f"{HABITACIONES_SERVICE_URL}/api/habitaciones", timeout=5)
        response.raise_for_status()
        habitaciones = response.json()
    except requests.exceptions.RequestException:
        return "No pude consultar los tipos de habitación en este momento."

    precios: dict[str, float] = {}
    for hab in habitaciones:
        tipo = hab.get("tipo_habitacion")
        precio = hab.get("precio_base")
        if tipo and tipo not in precios:
            precios[tipo] = precio
    if not precios:
        return "Por ahora no hay habitaciones registradas."

    lineas = [f"- {tipo}: ${float(precio):,.0f} por noche" for tipo, precio in precios.items()]
    return "Estos son nuestros tipos de habitación:\n" + "\n".join(lineas)


def _listar_servicios_adicionales() -> str:
    try:
        response = requests.get(f"{RESERVAS_SERVICE_URL}/reservas/servicios-adicionales", timeout=5)
        response.raise_for_status()
        servicios = response.json()
    except requests.exceptions.RequestException:
        return "No pude consultar los servicios adicionales en este momento."

    if not servicios:
        return "Por ahora no tenemos servicios adicionales registrados."

    lineas = [
        f"- {s['nombre']} (${float(s['precio']):,.0f}{' por persona' if s.get('por_persona') else ''})"
        for s in servicios
    ]
    return "Estos son los servicios adicionales que ofrecemos:\n" + "\n".join(lineas)


# [PENDIENTE] Estas respuestas son placeholders: complétalas con la información real del hotel
# antes de usar el chatbot en producción o en la sustentación.
RESPUESTA_CHECKIN_CHECKOUT = (
    "[PENDIENTE: confirmar horario real del hotel] El check-in es a partir de las 3:00 p.m. "
    "y el check-out antes de las 12:00 m. Si necesitas check-in anticipado o check-out tardío, "
    "contáctanos directamente."
)

RESPUESTA_UBICACION = (
    "[PENDIENTE: completar con la dirección real] Puedes encontrarnos en [dirección del hotel]. "
    "Para indicaciones exactas, contáctanos."
)

RESPUESTA_CONTACTO = (
    "[PENDIENTE: completar con datos reales de contacto] Puedes escribirnos a [correo/teléfono del hotel]."
)

RESPUESTA_COMO_RESERVAR = (
    "Para reservar: inicia sesión o crea una cuenta, elige el tipo de habitación, selecciona tus "
    "fechas y número de huéspedes, y confirma la reserva desde la sección 'Reservas' de la página."
)

# Cada regla es (lista de palabras clave, función que genera la respuesta).
# Se evalúan en orden; la primera que matchea gana.
REGLAS_FAQ: list[tuple[list[str], "callable"]] = [
    (["check-in", "checkin", "check in", "hora de llegada", "entrada"], lambda: RESPUESTA_CHECKIN_CHECKOUT),
    (["check-out", "checkout", "check out", "hora de salida", "salida"], lambda: RESPUESTA_CHECKIN_CHECKOUT),
    (["cómo reservar", "como reservar", "cómo reservo", "como reservo", "quiero reservar"], lambda: RESPUESTA_COMO_RESERVAR),
    (
        ["tipos de habitación", "tipos de habitaciones", "qué habitaciones", "que habitaciones", "precio de las habitaciones", "precios de las habitaciones"],
        _listar_tipos_habitacion,
    ),
    (["servicios adicionales", "qué servicios", "que servicios", "spa", "masaje", "yoga"], _listar_servicios_adicionales),
    (["ubicación", "ubicacion", "dirección", "direccion", "dónde queda", "donde queda"], lambda: RESPUESTA_UBICACION),
    (["contacto", "teléfono", "telefono", "whatsapp", "correo"], lambda: RESPUESTA_CONTACTO),
]


def buscar_respuesta_faq(mensaje: str) -> str | None:
    texto = _normalizar(mensaje)
    for palabras_clave, generar_respuesta in REGLAS_FAQ:
        if any(_normalizar(palabra) in texto for palabra in palabras_clave):
            return generar_respuesta()
    return None
