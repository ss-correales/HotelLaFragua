from fastapi import APIRouter, Depends

from .. import schemas
from ..email import enviar_correo
from ..plantillas import correo_bienvenida, correo_confirmacion_reserva
from ..security import verify_token

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.post("/bienvenida", response_model=schemas.NotificacionResponse)
def notificar_bienvenida(payload: schemas.BienvenidaRequest, current_user=Depends(verify_token)):
    asunto, html = correo_bienvenida(payload.nombre)
    return {"enviado": enviar_correo(payload.correo, asunto, html)}


@router.post("/confirmacion-reserva", response_model=schemas.NotificacionResponse)
def notificar_confirmacion_reserva(payload: schemas.ConfirmacionReservaRequest, current_user=Depends(verify_token)):
    asunto, html = correo_confirmacion_reserva(
        payload.nombre, payload.tipo_habitacion, payload.fecha_inicio, payload.fecha_fin, payload.total
    )
    return {"enviado": enviar_correo(payload.correo, asunto, html)}
