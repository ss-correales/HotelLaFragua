from sqlalchemy import Column, Integer, String, DECIMAL, Enum, DateTime, func, ForeignKey, JSON, Text
from .database import Base

class Habitacion(Base):
    __tablename__ = "habitaciones"

    numero_habitacion = Column(Integer, primary_key=True, index=True)
    tipo_habitacion = Column(Enum('Individual', 'Doble', 'Familiar', 'Suite', name='tipo_habitacion_enum'), nullable=False)
    descripcion = Column(Text, nullable=True)
    ocupacion = Column(Integer, nullable=False)
    numero_camas = Column(Integer, nullable=False)
    precio_base = Column(DECIMAL(10,2), nullable=False)
    estado = Column(Enum('Libre', 'Ocupada', 'Limpieza', 'Mantenimiento', name='estado_enum'), nullable=False, default='Libre')
    limpieza_hasta = Column(DateTime, nullable=True)
    comodidades = Column(JSON, nullable=True)
    foto = Column(Text, nullable=True)


class OcupacionHabitacion(Base):
    __tablename__ = "ocupacion_habitaciones"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    numero_habitacion = Column(Integer, ForeignKey('habitaciones.numero_habitacion'), nullable=False)
    identificacion_cliente = Column(Integer, nullable=False)
    estado = Column(Enum('Ocupada', 'Finalizada', name='estado_ocupacion_enum'), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime, nullable=True)
