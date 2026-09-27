from pydantic import BaseModel
from datetime import date
from typing import List, Literal, Optional


class PagoBase(BaseModel):
    metodo_pago: str
    monto: float


class PagoCreate(PagoBase):
    pass


class PagoResponse(PagoBase):
    id_pago: int
    id_factura: int
    fecha_pago: date
    referencia_wompi: Optional[str] = None
    transaccion_wompi_id: Optional[str] = None
    estado_wompi: Optional[str] = None

    class Config:
        from_attributes = True


class WompiCheckoutResponse(BaseModel):
    public_key: str
    currency: Literal["COP"] = "COP"
    amount_in_cents: int
    reference: str
    integrity_signature: str
    redirect_url: str | None = None


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
