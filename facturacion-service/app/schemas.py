from pydantic import BaseModel
from datetime import date
from typing import List, Literal


class PagoBase(BaseModel):
    metodo_pago: str
    monto: float


class PagoCreate(PagoBase):
    pass


class PagoResponse(PagoBase):
    id_pago: int
    id_factura: int
    fecha_pago: date

    class Config:
        from_attributes = True


class FacturaBase(BaseModel):
    id_reserva: int
    total: float
    estado: Literal["pendiente", "pagada"] = "pendiente"


class FacturaCreate(FacturaBase):
    pass


class FacturaResponse(FacturaBase):
    id_factura: int
    fecha_emision: date
    pagos: List[PagoResponse] = []

    class Config:
        from_attributes = True
