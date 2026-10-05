from pydantic import BaseModel


class BienvenidaRequest(BaseModel):
    correo: str
    nombre: str | None = None


class ConfirmacionReservaRequest(BaseModel):
    correo: str
    nombre: str | None = None
    tipo_habitacion: str
    fecha_inicio: str
    fecha_fin: str
    total: float


class NotificacionResponse(BaseModel):
    enviado: bool
