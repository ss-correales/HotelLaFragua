from sqlalchemy import Column, Integer, String, TIMESTAMP, func
from .database import Base

class Empleado(Base):
    __tablename__ = "empleados"

    id_empleado = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    documento = Column(String(50), unique=True)
    cargo = Column(String(50))
    email = Column(String(100))
    telefono = Column(String(20))
    estado = Column(String(20), default="activo")
    fecha_registro = Column(TIMESTAMP, server_default=func.now())
