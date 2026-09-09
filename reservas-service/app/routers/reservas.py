from datetime import date
import os
import requests
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas
from ..security import verify_token, require_admin, generar_token_sistema

router = APIRouter(
    prefix="/reservas",
    tags=["Reservas"]
)

@router.get("/", response_model=list[schemas.ReservaResponse])
def listar_reservas(db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return crud.listar_reservas(db)


@router.get("/mias", response_model=list[schemas.ReservaResponse])
def mis_reservas(db: Session = Depends(get_db), current_user = Depends(verify_token)):
    correo = current_user.get("correo") if isinstance(current_user, dict) else None
    if not correo:
        raise HTTPException(status_code=400, detail="No se pudo identificar al usuario del token")
    return crud.reservas_por_correo(db, correo)


@router.get("/servicios-adicionales")
def listar_servicios_adicionales():
    return [
        {"nombre": nombre, "precio": info["precio"], "categoria": info["categoria"], "por_persona": info["por_persona"]}
        for nombre, info in crud.SERVICIOS_ADICIONALES.items()
    ]


@router.get("/disponibles")
def verificar_disponibilidad(tipo_habitacion: str, fecha_inicio: date, fecha_fin: date, db: Session = Depends(get_db)):
    if fecha_inicio >= fecha_fin:
        raise HTTPException(status_code=400, detail="La fecha de inicio debe ser anterior a la fecha de fin")
    disponibles = crud.verificar_disponibilidad(db, tipo_habitacion, fecha_inicio, fecha_fin)
    return {"tipo_habitacion": tipo_habitacion, "disponibles": disponibles}


@router.get("/{id_reserva}", response_model=schemas.ReservaResponse)
def obtener_reserva(id_reserva: int, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    reserva = crud.obtener_reserva(db, id_reserva)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva


@router.post("/", response_model=schemas.ReservaResponse)
def crear_reserva(reserva: schemas.ReservaCreate,
                  request: Request,
                  db=Depends(get_db),
                  current_user = Depends(verify_token)):
    roles = current_user.get("roles", []) if isinstance(current_user, dict) else []
    canal = "Presencial" if any(r in roles for r in ("Administrador", "Empleado")) else "Online"
    nueva = crud.crear_reserva(db, reserva, canal=canal, auth_header=request.headers.get("authorization"))
    return nueva


@router.post("/{id_reserva}/pago/wompi/checkout")
def iniciar_pago_wompi(id_reserva: int,
                       request: Request,
                       db: Session = Depends(get_db),
                       current_user = Depends(verify_token)):
    reserva = crud.obtener_reserva(db, id_reserva)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    roles = current_user.get("roles", []) if isinstance(current_user, dict) else []
    es_staff = any(r in roles for r in ("Administrador", "Empleado"))
    if not es_staff:
        correo = current_user.get("correo") if isinstance(current_user, dict) else None
        if not correo or not crud.es_dueno_de_reserva(correo, reserva.identificacion_cliente, request.headers.get("authorization")):
            raise HTTPException(status_code=403, detail="No puedes pagar una reserva que no es tuya")
    try:
        response = requests.post(
            f"{os.getenv('FACTURACION_SERVICE_URL', 'http://localhost:8084')}/facturas/reserva/{id_reserva}/wompi/checkout",
            headers={"Authorization": f"Bearer {generar_token_sistema()}"},
            timeout=8,
        )
    except requests.exceptions.RequestException as exc:
        raise HTTPException(status_code=503, detail="Servicio de facturacion no disponible") from exc
    if response.status_code != 200:
        try:
            detail = response.json().get("detail", "No fue posible iniciar el pago")
        except ValueError:
            detail = "No fue posible iniciar el pago"
        raise HTTPException(status_code=response.status_code, detail=detail)
    return response.json()


@router.patch("/{id_reserva}/confirmar-pago", response_model=schemas.ReservaResponse)
def confirmar_pago(id_reserva: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return crud.confirmar_pago_reserva(db, id_reserva)


@router.post("/{id_reserva}/checkin", response_model=schemas.ReservaResponse)
def checkin_reserva(id_reserva: int,
                    request: Request,
                    checkin_data: schemas.ReservaCheckin = schemas.ReservaCheckin(),
                    db=Depends(get_db),
                    current_user = Depends(verify_token)):
    return crud.checkin_reserva(
        db, id_reserva,
        current_user=current_user,
        numero_habitacion=checkin_data.numero_habitacion,
        servicios_adicionales=checkin_data.servicios_adicionales,
        auth_header=request.headers.get("authorization"),
    )


@router.post("/{id_reserva}/checkout", response_model=schemas.ReservaResponse)
def checkout_reserva(id_reserva: int,
                     request: Request,
                     checkout_data: schemas.ReservaCheckout = schemas.ReservaCheckout(),
                     db=Depends(get_db),
                     current_user = Depends(require_admin)):
    return crud.checkout_reserva(
        db, id_reserva,
        monto_danos=checkout_data.monto_danos,
        auth_header=request.headers.get("authorization"),
    )
