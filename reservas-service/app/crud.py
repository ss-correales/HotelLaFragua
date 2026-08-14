import os
from pathlib import Path
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from .models import Reserva
from .database import SessionLocal
from .security import generar_token_sistema
import requests
from fastapi import HTTPException
from datetime import date, timedelta
from typing import List, Dict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SERVICE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(SERVICE_DIR / ".env")

CLIENTES_SERVICE_URL = os.getenv("CLIENTES_SERVICE_URL", "http://localhost:8081")
HABITACIONES_SERVICE_URL = os.getenv("HABITACIONES_SERVICE_URL", "http://localhost:8082/api")
FACTURACION_SERVICE_URL = os.getenv("FACTURACION_SERVICE_URL", "http://localhost:8084")


def verificar_cliente(id_cliente: int, auth_header: str | None = None) -> bool:
    try:
        response = requests.get(
            f"{CLIENTES_SERVICE_URL}/clientes/documento/{id_cliente}",
            headers={"Authorization": auth_header or f"Bearer {generar_token_sistema()}"},
            timeout=5,
        )
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="Servicio de clientes no disponible")

    return response.status_code == 200


def es_dueno_de_reserva(correo: str, identificacion_cliente: int, auth_header: str | None = None) -> bool:
    try:
        response = requests.get(
            f"{CLIENTES_SERVICE_URL}/clientes/correo/{correo}",
            headers={"Authorization": auth_header or f"Bearer {generar_token_sistema()}"},
            timeout=5,
        )
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="Servicio de clientes no disponible")

    if response.status_code != 200:
        return False

    numero_documento = response.json().get("numero_documento")
    try:
        return int(numero_documento) == int(identificacion_cliente)
    except (TypeError, ValueError):
        return False


def obtener_habitaciones_por_tipo(tipo_habitacion: str) -> List[Dict]:
    try:
        response = requests.get(f"{HABITACIONES_SERVICE_URL}/habitaciones", timeout=5)
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="Servicio de habitaciones no disponible")

    if response.status_code != 200:
        raise HTTPException(status_code=503, detail="No se pudo consultar el inventario de habitaciones")

    habitaciones = response.json() or []
    return [h for h in habitaciones if h.get("tipo_habitacion") == tipo_habitacion]


def verificar_disponibilidad(db: Session, tipo_habitacion: str, fecha_inicio: date, fecha_fin: date) -> int:
    habitaciones_tipo = obtener_habitaciones_por_tipo(tipo_habitacion)
    total_habitaciones = len(habitaciones_tipo)
    if total_habitaciones == 0:
        return 0

    solapadas = contar_reservas_solapadas(db, tipo_habitacion, fecha_inicio, fecha_fin)
    return max(total_habitaciones - solapadas, 0)


def generar_factura(id_reserva: int, total: float) -> None:
    try:
        response = requests.post(
            f"{FACTURACION_SERVICE_URL}/facturas/",
            json={"id_reserva": id_reserva, "total": total, "estado": "pendiente"},
            headers={"Authorization": f"Bearer {generar_token_sistema()}"},
            timeout=5,
        )
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="Servicio de facturación no disponible")

    if response.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail="No se pudo generar la factura de la reserva")


def contar_reservas_solapadas(db: Session, tipo_habitacion: str, fecha_inicio: date, fecha_fin: date) -> int:
    return db.query(Reserva).filter(
        Reserva.tipo_habitacion == tipo_habitacion,
        Reserva.estado.in_(["Pendiente", "Confirmada"]),
        Reserva.fecha_inicio < fecha_fin,
        Reserva.fecha_fin > fecha_inicio,
    ).count()


def crear_reserva(db: Session, reserva, canal: str = "Online", auth_header: str | None = None):
    if reserva.fecha_inicio >= reserva.fecha_fin:
        raise HTTPException(status_code=400, detail="La fecha de inicio debe ser anterior a la fecha de fin")

    if reserva.fecha_inicio < date.today():
        raise HTTPException(status_code=400, detail="La fecha de inicio no puede ser anterior a la fecha de creación de la reserva")

    if not verificar_cliente(reserva.identificacion_cliente, auth_header=auth_header):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    habitaciones_tipo = obtener_habitaciones_por_tipo(reserva.tipo_habitacion)
    if len(habitaciones_tipo) == 0:
        raise HTTPException(status_code=400, detail=f"No existe tipo de habitación '{reserva.tipo_habitacion}'")

    total_habitaciones = len(habitaciones_tipo)
    solapadas = contar_reservas_solapadas(db, reserva.tipo_habitacion, reserva.fecha_inicio, reserva.fecha_fin)

    if solapadas >= total_habitaciones:
        raise HTTPException(status_code=409, detail="No hay disponibilidad para el tipo de habitación en el periodo solicitado")

    noches = (reserva.fecha_fin - reserva.fecha_inicio).days
    precio_noche = float(habitaciones_tipo[0]["precio_base"])
    total = round(noches * precio_noche, 2)

    nueva_reserva = Reserva(
        identificacion_cliente=reserva.identificacion_cliente,
        tipo_habitacion=reserva.tipo_habitacion,
        numero_habitacion=None,
        fecha_inicio=reserva.fecha_inicio,
        fecha_fin=reserva.fecha_fin,
        estado="Pendiente",
        canal=canal,
    )

    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)

    try:
        generar_factura(nueva_reserva.id_reserva, total)
    except HTTPException:
        db.delete(nueva_reserva)
        db.commit()
        raise

    return nueva_reserva


def listar_reservas(db: Session):
    return db.query(Reserva).all()


def obtener_reserva(db: Session, id_reserva: int):
    return db.query(Reserva).filter(Reserva.id_reserva == id_reserva).first()


def reservas_por_correo(db: Session, correo: str) -> list[Reserva]:
    try:
        response = requests.get(
            f"{CLIENTES_SERVICE_URL}/clientes/correo/{correo}",
            headers={"Authorization": f"Bearer {generar_token_sistema()}"},
            timeout=5,
        )
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="Servicio de clientes no disponible")

    if response.status_code != 200:
        return []

    try:
        identificacion_cliente = int(response.json().get("numero_documento"))
    except (TypeError, ValueError):
        return []

    return db.query(Reserva).filter(Reserva.identificacion_cliente == identificacion_cliente).all()


def checkin_reserva(db: Session, id_reserva: int, current_user: dict, numero_habitacion: int | None = None, auth_header: str | None = None):
    reserva = obtener_reserva(db, id_reserva)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if reserva.estado not in ["Pendiente", "Confirmada"]:
        raise HTTPException(status_code=400, detail="Reserva no está en un estado válido para check-in")

    roles = current_user.get("roles", []) if isinstance(current_user, dict) else []
    es_staff = any(r in roles for r in ("Administrador", "Empleado"))

    if not es_staff:
        if numero_habitacion is not None:
            raise HTTPException(status_code=403, detail="Solo el personal del hotel puede elegir una habitación específica")

        correo = current_user.get("correo") if isinstance(current_user, dict) else None
        if not correo or not es_dueno_de_reserva(correo, reserva.identificacion_cliente, auth_header):
            raise HTTPException(status_code=403, detail="No puedes hacer check-in de una reserva que no es tuya")

        if date.today() < reserva.fecha_inicio - timedelta(days=1):
            raise HTTPException(status_code=400, detail="El check-in solo está disponible desde 24 horas antes de la fecha de inicio")

    habitaciones_disponibles = [h for h in obtener_habitaciones_por_tipo(reserva.tipo_habitacion) if h.get("estado") == "Libre"]
    if not habitaciones_disponibles:
        raise HTTPException(status_code=409, detail="No hay habitaciones libres disponibles para este tipo")

    if numero_habitacion is not None:
        habitacion_asignada = next((h for h in habitaciones_disponibles if h["numero_habitacion"] == numero_habitacion), None)
        if not habitacion_asignada:
            raise HTTPException(status_code=409, detail="La habitación indicada no está disponible")
    else:
        habitacion_asignada = habitaciones_disponibles[0]

    numero_habitacion = habitacion_asignada["numero_habitacion"]

    try:
        response = requests.put(
            f"{HABITACIONES_SERVICE_URL}/habitaciones/{numero_habitacion}",
            json={"estado": "Ocupada"},
            headers={"Authorization": f"Bearer {generar_token_sistema()}"},
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


def checkout_reserva(db: Session, id_reserva: int, auth_header: str | None = None):
    reserva = obtener_reserva(db, id_reserva)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if reserva.estado != "Confirmada":
        raise HTTPException(status_code=400, detail="Reserva no está confirmada")

    if reserva.numero_habitacion is None:
        raise HTTPException(status_code=400, detail="Reserva no tiene habitación asignada")

    try:
        response = requests.put(
            f"{HABITACIONES_SERVICE_URL}/habitaciones/{reserva.numero_habitacion}",
            json={"estado": "Limpieza"},
            headers={"Authorization": f"Bearer {generar_token_sistema()}"},
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
                        f"{HABITACIONES_SERVICE_URL}/habitaciones/{reserva.numero_habitacion}",
                        json={"estado": "Limpieza"},
                        headers={"Authorization": f"Bearer {generar_token_sistema()}"},
                        timeout=5,
                    )
                except requests.exceptions.RequestException:
                    pass

        db.commit()
    finally:
        db.close()
