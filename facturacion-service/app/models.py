from sqlalchemy import Column, Integer, Float, String, Date, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from .database import Base
from datetime import date


class Factura(Base):
    __tablename__ = "facturas"

    id_factura = Column(Integer, primary_key=True, index=True)
    id_reserva = Column(Integer, nullable=False)
    total = Column(Float, nullable=False)
    fecha_emision = Column(Date, default=date.today)
    estado = Column(Enum('pendiente', 'pagada', name='estado_factura_enum'), default='pendiente')

    pagos = relationship("Pago", back_populates="factura")


class Pago(Base):
    __tablename__ = "pagos"

    id_pago = Column(Integer, primary_key=True, index=True)
    id_factura = Column(Integer, ForeignKey("facturas.id_factura"), nullable=False)
    metodo_pago = Column(String(50), nullable=False)
    monto = Column(Float, nullable=False)
    fecha_pago = Column(Date, default=date.today)
    referencia_wompi = Column(String(100), unique=True, index=True, nullable=True)
    transaccion_wompi_id = Column(String(100), unique=True, index=True, nullable=True)
    estado_wompi = Column(String(20), nullable=True)
    monto_centavos = Column(Integer, nullable=True)
    moneda = Column(String(3), nullable=True)
    evento_wompi = Column(JSON, nullable=True)
    fecha_confirmacion = Column(DateTime, nullable=True)

    factura = relationship("Factura", back_populates="pagos")
