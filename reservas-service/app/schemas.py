from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, Literal, List

class ReservaBase(BaseModel):
    identificacion_cliente: int = Field(..., gt=0)
    tipo_habitacion: Literal["Individual", "Doble", "Familiar", "Suite"]
    fecha_inicio: date
    fecha_fin: date
    adultos: int = Field(..., gt=0)
    ninos: int = Field(0, ge=0)
    bebes: int = Field(0, ge=0)

    class Config:
        str_strip_whitespace = True

class ReservaCreate(ReservaBase):
    servicios_adicionales: Optional[List[str]] = []

class ReservaCheckin(BaseModel):
    numero_habitacion: Optional[int] = None
    servicios_adicionales: Optional[List[str]] = None

class ReservaCheckout(BaseModel):
    monto_danos: float = Field(0, ge=0)

class ReservaResponse(ReservaBase):
    id_reserva: int
    numero_habitacion: Optional[int] = None
    estado: Literal["Pendiente", "Confirmada", "Cancelada", "Finalizada"]
    fecha_creacion: datetime
    canal: Optional[Literal["Online", "Presencial"]] = None
    servicios_adicionales: Optional[List[str]] = []

    class Config:
        from_attributes = True