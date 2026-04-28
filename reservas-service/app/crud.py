import os
from sqlalchemy.orm import Session
from .models import Reserva
from .database import SessionLocal
import requests
from fastapi import HTTPException
from datetime import date
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

CLIENTES_SERVICE_URL = os.getenv("CLIENTES_SERVICE_URL", "http://localhost:8081")
HABITACIONES_SERVICE_URL = os.getenv("HABITACIONES_SERVICE_URL", "http://localhost:8082")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "hotel_lafragua_internal")


def build_internal_headers(authorization: str | None = None) -> Dict[str, str]:
    headers: Dict[str, str] = {"X-Internal-Token": INTERNAL_SERVICE_TOKEN}
    if authorization:
        headers["Authorization"] = authorization
    return headers


def verificar_cliente(id_cliente: int, authorization: str | None = None) -> bool:
    try:
        response = requests.get(
            f"{CLIENTES_SERVICE_URL}/clientes/documento/{id_cliente}",
            headers=build_internal_headers(authorization),
            timeout=5,
        )
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="Servicio de clientes no disponible")

    return response.status_code == 200


def obtener_habitaciones_por_tipo(tipo_habitacion: str, authorization: str | None = None) -> List[Dict]:
    try:
        response = requests.get(
            f"{HABITACIONES_SERVICE_URL}/api/habitaciones",
            headers=build_internal_headers(authorization),
            timeout=5,
        )
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="Servicio de habitaciones no disponible")

    if response.status_code != 200:
        raise HTTPException(status_code=503, detail="No se pudo consultar el inventario de habitaciones")

    habitaciones = response.json() or []
    return [h for h in habitaciones if h.get("tipo_habitacion") == tipo_habitacion]


def contar_reservas_solapadas(db: Session, tipo_habitacion: str, fecha_inicio: date, fecha_fin: date) -> int:
    return db.query(Reserva).filter(
        Reserva.tipo_habitacion == tipo_habitacion,
        Reserva.estado.in_(["Pendiente", "Confirmada"]),
        Reserva.fecha_inicio < fecha_fin,
        Reserva.fecha_fin > fecha_inicio,
    ).count()


def crear_reserva(db: Session, reserva, authorization: str | None = None):
    if reserva.fecha_inicio >= reserva.fecha_fin:
        raise HTTPException(status_code=400, detail="La fecha de inicio debe ser anterior a la fecha de fin")

    if not verificar_cliente(reserva.identificacion_cliente, authorization):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    habitaciones_tipo = obtener_habitaciones_por_tipo(reserva.tipo_habitacion, authorization)
    if len(habitaciones_tipo) == 0:
        raise HTTPException(status_code=400, detail=f"No existe tipo de habitación '{reserva.tipo_habitacion}'")

    total_habitaciones = len(habitaciones_tipo)
    solapadas = contar_reservas_solapadas(db, reserva.tipo_habitacion, reserva.fecha_inicio, reserva.fecha_fin)

    if solapadas >= total_habitaciones:
        raise HTTPException(status_code=409, detail="No hay disponibilidad para el tipo de habitación en el periodo solicitado")

    nueva_reserva = Reserva(
        identificacion_cliente=reserva.identificacion_cliente,
        tipo_habitacion=reserva.tipo_habitacion,
        numero_habitacion=None,
        fecha_inicio=reserva.fecha_inicio,
        fecha_fin=reserva.fecha_fin,
        estado="Pendiente",
    )

    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)

    return nueva_reserva


def listar_reservas(db: Session):
    return db.query(Reserva).all()


def obtener_reserva(db: Session, id_reserva: int):
    return db.query(Reserva).filter(Reserva.id_reserva == id_reserva).first()


def checkin_reserva(db: Session, id_reserva: int, authorization: str | None = None):
    reserva = obtener_reserva(db, id_reserva)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if reserva.estado not in ["Pendiente", "Confirmada"]:
        raise HTTPException(status_code=400, detail="Reserva no está en un estado válido para check-in")

    habitaciones_tipo = [
        h for h in obtener_habitaciones_por_tipo(reserva.tipo_habitacion, authorization)
        if h.get("estado") == "Libre"
    ]
    if not habitaciones_tipo:
        raise HTTPException(status_code=409, detail="No hay habitaciones libres disponibles para este tipo")

    habitacion_asignada = habitaciones_tipo[0]
    numero_habitacion = habitacion_asignada["numero_habitacion"]

    try:
        response = requests.put(
            f"{HABITACIONES_SERVICE_URL}/api/habitaciones/{numero_habitacion}",
            json={"estado": "Ocupada"},
            headers=build_internal_headers(authorization),
            timeout=5,
        )
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="Servicio de habitaciones no disponible para asignar habitación")

    if response.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail="Error al asignar la habitación al check-in")

    reserva.numero_habitacion = numero_habitacion
    reserva.estado = "Confirmada"
    db.commit()
    db.refresh(reserva)

    return reserva


def checkout_reserva(db: Session, id_reserva: int, authorization: str | None = None):
    reserva = obtener_reserva(db, id_reserva)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if reserva.estado != "Confirmada":
        raise HTTPException(status_code=400, detail="Reserva no está confirmada")

    if reserva.numero_habitacion is None:
        raise HTTPException(status_code=400, detail="Reserva no tiene habitación asignada")

    try:
        response = requests.put(
            f"{HABITACIONES_SERVICE_URL}/api/habitaciones/{reserva.numero_habitacion}",
            json={"estado": "Libre"},
            headers=build_internal_headers(authorization),
            timeout=5,
        )
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="Servicio de habitaciones no disponible para liberar habitación")

    if response.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail="Error al liberar la habitación en check-out")

    reserva.estado = "Finalizada"
    db.commit()
    db.refresh(reserva)

    return reserva


def actualizar_reservas_vencidas():
    db = SessionLocal()
    try:
        pendientes = db.query(Reserva).filter(
            Reserva.fecha_fin < date.today(),
            Reserva.estado.in_(["Pendiente", "Confirmada"]),
        ).all()

        for reserva in pendientes:
            reserva.estado = "Finalizada"

            if reserva.numero_habitacion:
                try:
                    requests.put(
                        f"{HABITACIONES_SERVICE_URL}/api/habitaciones/{reserva.numero_habitacion}",
                        json={"estado": "Libre"},
                        headers=build_internal_headers(),
                        timeout=5,
                    )
                except requests.exceptions.RequestException:
                    pass

        db.commit()
    finally:
        db.close()
