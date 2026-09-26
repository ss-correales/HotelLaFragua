from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RolBase(BaseModel):
    nombre: str

class RolCreate(RolBase):
    pass

class Rol(RolBase):
    id_rol: int

    class Config:
        from_attributes = True

class UsuarioBase(BaseModel):
    nombre_usuario: str
    correo: str
    numero_documento: int

class UsuarioCreate(UsuarioBase):
    contraseña: str  # La contraseña sin hash para crear
    roles: Optional[List[str]] = []  # Lista de nombres de roles

class UsuarioLogin(BaseModel):
    correo: str
    contraseña: str

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    estado: bool
    fecha_creacion: Optional[datetime]
    roles: List[Rol] = []

    class Config:
        from_attributes = True

class UsuarioUpdate(BaseModel):
    nombre_usuario: Optional[str] = None
    correo: Optional[str] = None
    estado: Optional[bool] = None
    roles: Optional[List[str]] = None
