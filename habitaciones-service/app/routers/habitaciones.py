import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas
from ..security import verify_token
from dotenv import load_dotenv

router = APIRouter(prefix="/api/habitaciones", tags=["Habitaciones"])
load_dotenv()

CLIENTES_SERVICE_URL = os.getenv("CLIENTES_SERVICE_URL", "http://localhost:8081")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "hotel_lafragua_internal")


@router.get("", response_model=list[schemas.Habitacion])
def listar_habitaciones_sin_slash(db: Session = Depends(get_db)):
    return crud.get_habitaciones(db)


@router.get("/", response_model=list[schemas.Habitacion])
def listar_habitaciones(db: Session = Depends(get_db), current_user = Depends(verify_token)):
    return crud.get_habitaciones(db)


@router.post("", response_model=schemas.Habitacion)
def crear_habitacion_sin_slash(habitacion: schemas.HabitacionCreate, db: Session = Depends(get_db)):
    nueva_habitacion = crud.create_habitacion(db, habitacion)
    if not nueva_habitacion:
        raise HTTPException(status_code=400, detail="Habitación con este número ya existe")
    return nueva_habitacion


@router.post("/", response_model=schemas.Habitacion)
def crear_habitacion(habitacion: schemas.HabitacionCreate, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    nueva_habitacion = crud.create_habitacion(db, habitacion)
    if not nueva_habitacion:
        raise HTTPException(status_code=400, detail="Habitación con este número ya existe")
    return nueva_habitacion


@router.put("/{numero_habitacion}", response_model=schemas.Habitacion)
def actualizar_habitacion(numero_habitacion: int, habitacion_update: schemas.HabitacionUpdate, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    habitacion = crud.update_habitacion(db, numero_habitacion, habitacion_update)
    if not habitacion:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    return habitacion


@router.delete("/{numero_habitacion}")
def eliminar_habitacion(numero_habitacion: int, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    eliminada = crud.delete_habitacion(db, numero_habitacion)
    if not eliminada:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    return {"mensaje": "Habitación eliminada"}


# -----------------------------
# Operaciones de ocupación
# -----------------------------

def validar_cliente_existente(id_cliente: int, authorization: str | None = None):
    headers = {"X-Internal-Token": INTERNAL_SERVICE_TOKEN}
    if authorization:
        headers["Authorization"] = authorization

    try:
        response = httpx.get(
            f"{CLIENTES_SERVICE_URL}/clientes/documento/{id_cliente}",
            headers=headers,
            timeout=3,
        )
        return response.status_code == 200
    except httpx.HTTPStatusError:
        return False
    except httpx.RequestError:
        return False


@router.get("/ocupaciones", response_model=list[schemas.OcupacionHabitacion])
def listar_ocupaciones(db: Session = Depends(get_db), current_user = Depends(verify_token)):
    return crud.get_ocupaciones(db)


@router.get("/ocupaciones/activas", response_model=list[schemas.OcupacionHabitacion])
def listar_ocupaciones_activas(db: Session = Depends(get_db), current_user = Depends(verify_token)):
    return crud.get_ocupaciones_activas(db)


@router.post("/ocupaciones", response_model=schemas.OcupacionHabitacion)
def crear_ocupacion(
    ocupacion: schemas.OcupacionHabitacionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(verify_token),
):
    # Verificar cliente en microservicio de clientes
    if not validar_cliente_existente(ocupacion.identificacion_cliente, request.headers.get("authorization")):
        raise HTTPException(status_code=400, detail="Cliente no válido")

    # Verificar disponibilidad de habitación
    from .. import models
    habitacion = db.query(models.Habitacion).filter(models.Habitacion.numero_habitacion == ocupacion.numero_habitacion).first()
    if not habitacion:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    if habitacion.estado != 'Libre':
        raise HTTPException(status_code=400, detail="Habitación no disponible")

    # Registrar ocupación
    registro = crud.create_ocupacion(db, ocupacion)

    # Marcar habitación como ocupada
    habitacion.estado = 'Ocupada'
    db.commit()
    db.refresh(habitacion)

    return registro


@router.put("/ocupaciones/{id_ocupacion}/finalizar", response_model=schemas.OcupacionHabitacion)
def finalizar_ocupacion(id_ocupacion: int, data: schemas.OcupacionHabitacionUpdate, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    ocupacion = crud.finalizar_ocupacion(db, id_ocupacion, data.fecha_fin)
    if not ocupacion:
        raise HTTPException(status_code=404, detail="Ocupación no encontrada")

    from .. import models
    # Liberar habitación en caso de cierre
    habitacion = db.query(models.Habitacion).filter(models.Habitacion.numero_habitacion == ocupacion.numero_habitacion).first()
    if habitacion:
        habitacion.estado = 'Libre'
        db.commit()
        db.refresh(habitacion)

    return ocupacion
