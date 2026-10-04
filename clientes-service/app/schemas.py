from pydantic import BaseModel, validator
from typing import Optional, Literal
from datetime import datetime

TipoDocumento = Literal["CC", "CE", "PASAPORTE"]

class ClienteBase(BaseModel):
    nombre: str
    apellido: str
    tipo_documento: Optional[TipoDocumento] = None
    numero_documento: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None

    @validator("tipo_documento")
    def validar_tipo_documento(cls, v):
        if v is None:
            return v
        validos = {"CC", "CE", "PASAPORTE"}
        if v not in validos:
            raise ValueError("tipo_documento debe ser uno de CC, CE, PASAPORTE")
        return v

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None

class Cliente(ClienteBase):
    id_cliente: int
    fecha_registro: Optional[datetime] = None

    class Config:
        from_attributes = True