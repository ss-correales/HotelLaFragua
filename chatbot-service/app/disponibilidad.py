import os
import re
from datetime import date

import requests

RESERVAS_SERVICE_URL = os.getenv("RESERVAS_SERVICE_URL", "http://localhost:8083")

TIPOS_HABITACION = {
    "individual": "Individual",
    "sencilla": "Individual",
    "doble": "Doble",
    "dobles": "Doble",
    "familiar": "Familiar",
    "suite": "Suite",
}

PATRON_FECHA = re.compile(r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})")


def _detectar_tipo(mensaje: str) -> str | None:
    texto = mensaje.lower()
    for palabra, tipo in TIPOS_HABITACION.items():
        if palabra in texto:
            return tipo
    return None


def _parsear_fecha(dia: str, mes: str, anio: str) -> date | None:
    anio_num = int(anio)
    if anio_num < 100:
        anio_num += 2000
    try:
        return date(anio_num, int(mes), int(dia))
    except ValueError:
        return None


def _detectar_fechas(mensaje: str) -> list[date]:
    fechas = []
    for coincidencia in PATRON_FECHA.finditer(mensaje):
        fecha = _parsear_fecha(*coincidencia.groups())
        if fecha:
            fechas.append(fecha)
    return fechas


def intentar_disponibilidad(mensaje: str) -> str | None:
    """Si el mensaje trae un tipo de habitación + 2 fechas, consulta disponibilidad real.
    Si no hay suficiente información, devuelve None para que siga el flujo de FAQ/LLM."""
    tipo = _detectar_tipo(mensaje)
    fechas = _detectar_fechas(mensaje)
    if not tipo or len(fechas) < 2:
        return None

    fecha_inicio, fecha_fin = sorted(fechas[:2])
    if fecha_inicio == fecha_fin:
        return None

    try:
        response = requests.get(
            f"{RESERVAS_SERVICE_URL}/reservas/disponibles",
            params={
                "tipo_habitacion": tipo,
                "fecha_inicio": fecha_inicio.isoformat(),
                "fecha_fin": fecha_fin.isoformat(),
            },
            timeout=5,
        )
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException:
        return "No pude consultar la disponibilidad en este momento. Intenta de nuevo en unos minutos."

    disponibles = data.get("disponibles", 0)
    rango = f"del {fecha_inicio.strftime('%d/%m/%Y')} al {fecha_fin.strftime('%d/%m/%Y')}"
    if disponibles > 0:
        return (
            f"Sí, tenemos {disponibles} habitación(es) tipo {tipo} disponibles {rango}. "
            "¿Quieres que te ayude con el proceso de reserva?"
        )
    return (
        f"Por ahora no tenemos habitaciones tipo {tipo} disponibles {rango}. "
        "¿Quieres que revise otro tipo de habitación o fechas distintas?"
    )
