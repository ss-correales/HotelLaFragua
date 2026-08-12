from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from .database import Base

# Tabla intermedia para la relación muchos a muchos entre usuarios y roles
usuario_rol = Table(
    'usuario_rol',
    Base.metadata,
    Column('id_usuario', Integer, ForeignKey('usuarios.id_usuario'), primary_key=True),
    Column('id_rol', Integer, ForeignKey('roles.id_rol'), primary_key=True)
)

class Rol(Base):
    __tablename__ = "roles"

    id_rol = Column(Integer, primary_key=True, autoincrement=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False, index=True)

    # Relación con usuarios
    usuarios = relationship("Usuario", secondary=usuario_rol, back_populates="roles")

class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, autoincrement=True, index=True)
    nombre_usuario = Column(String(50), unique=True, nullable=False, index=True)
    correo = Column(String(100), unique=True, nullable=False, index=True)
    numero_documento = Column(Integer, nullable=False)
    contraseña_hash = Column(String(255), nullable=False)
    estado = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column('fecha_creacin', DateTime, server_default='CURRENT_TIMESTAMP', nullable=True)

    # Relación con roles
    roles = relationship("Rol", secondary=usuario_rol, back_populates="usuarios")
