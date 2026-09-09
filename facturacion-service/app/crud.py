import os
import hashlib
import hmac
import uuid
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from .models import Factura, Pago
from .security import generar_token_sistema
import requests
from fastapi import HTTPException

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SERVICE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(SERVICE_DIR / ".env")

RESERVAS_SERVICE_URL = os.getenv("RESERVAS_SERVICE_URL", "http://localhost:8083")
WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY", "")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET", "")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET", "")
WOMPI_ENV = os.getenv("WOMPI_ENV", "test").strip().lower()
WOMPI_REDIRECT_URL = os.getenv("WOMPI_REDIRECT_URL", "http://localhost:5173/reservas")


def crear_factura(db: Session, factura):
    nueva = Factura(
        id_reserva=factura.id_reserva,
        total=factura.total,
        estado=factura.estado,
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


def listar_facturas(db: Session):
    return db.query(Factura).all()


def obtener_factura(db: Session, id_factura: int):
    return db.query(Factura).filter(Factura.id_factura == id_factura).first()


def facturas_por_reserva(db: Session, id_reserva: int):
    return db.query(Factura).filter(Factura.id_reserva == id_reserva).all()


def crear_pago(db: Session, id_factura: int, pago):
    nuevo = Pago(
        id_factura=id_factura,
        metodo_pago=pago.metodo_pago,
        monto=pago.monto,
    )

    db.add(nuevo)

    factura = obtener_factura(db, id_factura)
    factura.estado = "pagada"

    db.commit()
    db.refresh(nuevo)
    return nuevo


def listar_pagos_por_factura(db: Session, id_factura: int):
    return db.query(Pago).filter(Pago.id_factura == id_factura).all()


def iniciar_checkout_wompi(db: Session, id_reserva: int):
    if not WOMPI_PUBLIC_KEY or not WOMPI_INTEGRITY_SECRET:
        raise HTTPException(status_code=503, detail="Wompi no esta configurado en el servidor")
    factura = db.query(Factura).filter(
        Factura.id_reserva == id_reserva,
        Factura.estado == "pendiente",
    ).order_by(Factura.id_factura.asc()).first()
    if not factura:
        raise HTTPException(status_code=404, detail="No hay una factura pendiente para esta reserva")
    amount_in_cents = int(round(float(factura.total) * 100))
    if amount_in_cents <= 0:
        raise HTTPException(status_code=400, detail="El total de la factura debe ser mayor a cero")
    reference = f"RES-{id_reserva}-FAC-{factura.id_factura}-{uuid.uuid4().hex[:12]}"
    integrity = hashlib.sha256(
        f"{reference}{amount_in_cents}COP{WOMPI_INTEGRITY_SECRET}".encode("utf-8")
    ).hexdigest()
    pago = Pago(
        id_factura=factura.id_factura,
        metodo_pago="Wompi",
        monto=float(factura.total),
        referencia_wompi=reference,
        estado_wompi="PENDING",
        monto_centavos=amount_in_cents,
        moneda="COP",
    )
    db.add(pago)
    db.commit()
    return {
        "public_key": WOMPI_PUBLIC_KEY,
        "currency": "COP",
        "amount_in_cents": amount_in_cents,
        "reference": reference,
        "integrity_signature": integrity,
        "redirect_url": WOMPI_REDIRECT_URL,
    }


def _valor_anidado(data: dict, ruta: str):
    valor = data
    for clave in ruta.split("."):
        if not isinstance(valor, dict) or clave not in valor:
            raise KeyError(ruta)
        valor = valor[clave]
    return valor


def validar_evento_wompi(evento: dict) -> bool:
    if not WOMPI_EVENTS_SECRET:
        return False
    signature = evento.get("signature") or {}
    properties = signature.get("properties") or []
    checksum = signature.get("checksum")
    timestamp = evento.get("timestamp")
    if not properties or not checksum or timestamp is None:
        return False
    try:
        valores = "".join(str(_valor_anidado(evento.get("data") or {}, ruta)) for ruta in properties)
    except KeyError:
        return False
    esperado = hashlib.sha256(f"{valores}{timestamp}{WOMPI_EVENTS_SECRET}".encode("utf-8")).hexdigest()
    return hmac.compare_digest(esperado.lower(), str(checksum).lower())


def procesar_evento_wompi(db: Session, evento: dict):
    if evento.get("event") != "transaction.updated":
        return
    expected_environment = "test" if WOMPI_ENV == "test" else "prod"
    if evento.get("environment") != expected_environment:
        raise HTTPException(status_code=400, detail="El evento no corresponde al ambiente configurado")
    transaccion = ((evento.get("data") or {}).get("transaction") or {})
    pago = db.query(Pago).filter(Pago.referencia_wompi == transaccion.get("reference")).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Referencia de pago desconocida")
    if transaccion.get("amount_in_cents") != pago.monto_centavos or transaccion.get("currency") != pago.moneda:
        raise HTTPException(status_code=400, detail="El monto o la moneda del evento no coinciden")
    pago.estado_wompi = transaccion.get("status")
    pago.transaccion_wompi_id = transaccion.get("id")
    pago.evento_wompi = evento
    if pago.estado_wompi == "APPROVED":
        pago.fecha_confirmacion = datetime.utcnow()
        obtener_factura(db, pago.id_factura).estado = "pagada"
    db.commit()
    if pago.estado_wompi == "APPROVED":
        factura = obtener_factura(db, pago.id_factura)
        try:
            response = requests.patch(
                f"{RESERVAS_SERVICE_URL}/reservas/{factura.id_reserva}/confirmar-pago",
                headers={"Authorization": f"Bearer {generar_token_sistema()}"}, timeout=5,
            )
        except requests.exceptions.RequestException as exc:
            raise HTTPException(status_code=503, detail="No fue posible confirmar la reserva") from exc
        if response.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail="No fue posible confirmar la reserva")
