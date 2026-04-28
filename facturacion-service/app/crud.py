from sqlalchemy.orm import Session
from .models import Factura

def crear_factura(db: Session, factura):
    nueva = Factura(
        reserva_id=factura.reserva_id,
        cliente_id=factura.cliente_id,
        subtotal=factura.subtotal,
        impuestos=factura.impuestos,
        total=factura.total,
        metodo_pago=factura.metodo_pago,
        estado=factura.estado
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


def listar_facturas(db: Session):
    return db.query(Factura).all()


def obtener_factura(db: Session, id: int):
    return db.query(Factura).filter(Factura.id == id).first()


def facturas_por_cliente(db: Session, cliente_id: int):
    return db.query(Factura).filter(Factura.cliente_id == cliente_id).all()
