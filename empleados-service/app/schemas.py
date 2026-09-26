from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EmpleadoBase(BaseModel):
    nombre: str
    apellido: str
    documento: Optional[str] = None
    cargo: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    estado: str = "activo"

class EmpleadoCreate(EmpleadoBase):
    pass

class EmpleadoResponse(EmpleadoBase):
    id_empleado: int
    fecha_registro: Optional[datetime] = None

    class Config:
        from_attributes = True
