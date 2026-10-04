import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from ..database import get_db
from .. import crud, schemas
from ..security import require_admin
import urllib.request
import urllib.error

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SERVICE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(SERVICE_DIR / ".env")

CLIENTES_SERVICE_URL = os.getenv("CLIENTES_SERVICE_URL", "http://localhost:8081")
ESTADO_LIBRE = "Libre"
ESTADO_OCUPADA = "Ocupada"

router = APIRouter(prefix="/api/habitaciones", tags=["Habitaciones"])


@router.get("/", response_model=list[schemas.Habitacion])
def listar_habitaciones(db: Session = Depends(get_db)):
    # Catálogo público: no requiere token, se muestra a cualquier visitante
    return crud.get_habitaciones(db)


@router.post("/", response_model=schemas.Habitacion)
def crear_habitacion(habitacion: schemas.HabitacionCreate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    nueva_habitacion = crud.create_habitacion(db, habitacion)
    if not nueva_habitacion:
        raise HTTPException(status_code=400, detail="Habitación con este número ya existe")
    return nueva_habitacion


@router.put("/{numero_habitacion}", response_model=schemas.Habitacion)
def actualizar_habitacion(numero_habitacion: int, habitacion_update: schemas.HabitacionUpdate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    habitacion = crud.update_habitacion(db, numero_habitacion, habitacion_update)
    if not habitacion:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    return habitacion


@router.delete("/{numero_habitacion}")
def eliminar_habitacion(numero_habitacion: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    eliminada = crud.delete_habitacion(db, numero_habitacion)
    if not eliminada:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    return {"mensaje": "Habitación eliminada"}


# -----------------------------
# Operaciones de ocupación
# -----------------------------

def validar_cliente_existente(id_cliente: int):
    url = f"{CLIENTES_SERVICE_URL}/clientes/documento/{id_cliente}"
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            return response.status == 200
    except urllib.error.HTTPError:
        return False
    except urllib.error.URLError:
        return False


@router.get("/ocupaciones", response_model=list[schemas.OcupacionHabitacion])
def listar_ocupaciones(db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return crud.get_ocupaciones(db)


@router.get("/ocupaciones/activas", response_model=list[schemas.OcupacionHabitacion])
def listar_ocupaciones_activas(db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return crud.get_ocupaciones_activas(db)


@router.post("/ocupaciones", response_model=schemas.OcupacionHabitacion)
def crear_ocupacion(ocupacion: schemas.OcupacionHabitacionCreate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    # Verificar cliente en microservicio de clientes
    if not validar_cliente_existente(ocupacion.identificacion_cliente):
        raise HTTPException(status_code=400, detail="Cliente no válido")

    # Verificar disponibilidad de habitación
    from .. import models
    habitacion = db.query(models.Habitacion).filter(models.Habitacion.numero_habitacion == ocupacion.numero_habitacion).first()
    if not habitacion:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    if habitacion.estado != ESTADO_LIBRE:
        raise HTTPException(status_code=400, detail="Habitación no disponible")

    # Registrar ocupación
    registro = crud.create_ocupacion(db, ocupacion)

    # Marcar habitación como ocupada
    habitacion.estado = ESTADO_OCUPADA
    db.commit()
    db.refresh(habitacion)

    return registro


@router.put("/ocupaciones/{id_ocupacion}/finalizar", response_model=schemas.OcupacionHabitacion)
def finalizar_ocupacion(id_ocupacion: int, data: schemas.OcupacionHabitacionUpdate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    ocupacion = crud.finalizar_ocupacion(db, id_ocupacion, data.fecha_fin)
    if not ocupacion:
        raise HTTPException(status_code=404, detail="Ocupación no encontrada")

    from .. import models
    # Liberar habitación en caso de cierre
    habitacion = db.query(models.Habitacion).filter(models.Habitacion.numero_habitacion == ocupacion.numero_habitacion).first()
    if habitacion:
        habitacion.estado = ESTADO_LIBRE
        db.commit()
        db.refresh(habitacion)

    return ocupacion
