from .database import Base
from sqlalchemy import Column, Integer, String, Date, Enum, DateTime, CheckConstraint, func, JSON
from datetime import datetime

class Reserva(Base):
    __tablename__ = "reservas"

    id_reserva = Column(Integer, primary_key=True, autoincrement=True, index=True)
    identificacion_cliente = Column(Integer, nullable=False)
    tipo_habitacion = Column(Enum('Individual', 'Doble', 'Familiar', 'Suite', name='estado_tipo_habitacion_enum'), nullable=False)
    numero_habitacion = Column(Integer, nullable=True)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    estado = Column(Enum('Pendiente', 'Confirmada', 'Cancelada', 'Finalizada', name='estado_reserva_enum'), nullable=False, default='Pendiente')
    fecha_creacion = Column(DateTime, default=datetime.now, nullable=False)
    canal = Column(Enum('Online', 'Presencial', name='canal_reserva_enum'), nullable=True)
    servicios_adicionales = Column(JSON, nullable=True)
    adultos = Column(Integer, nullable=False, default=1)
    ninos = Column(Integer, nullable=False, default=0)
    bebes = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        CheckConstraint('fecha_inicio < fecha_fin', name='chk_fechas_validas'),
    )
