from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, Literal

class ReservaBase(BaseModel):
    identificacion_cliente: int = Field(..., gt=0)
    tipo_habitacion: Literal["Individual", "Doble", "Familiar", "Suite"]
    fecha_inicio: date
    fecha_fin: date

    class Config:
        str_strip_whitespace = True

class ReservaCreate(ReservaBase):
    pass

class ReservaCheckin(BaseModel):
    numero_habitacion: Optional[int] = None

class ReservaResponse(ReservaBase):
    id_reserva: int
    numero_habitacion: Optional[int] = None
    estado: Literal["Pendiente", "Confirmada", "Cancelada", "Finalizada"]
    fecha_creacion: datetime
    canal: Optional[Literal["Online", "Presencial"]] = None

    class Config:
        from_attributes = True