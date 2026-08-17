import os
from pathlib import Path
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from .models import Factura, Pago

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SERVICE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(SERVICE_DIR / ".env")

RESERVAS_SERVICE_URL = os.getenv("RESERVAS_SERVICE_URL", "http://localhost:8083")


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
