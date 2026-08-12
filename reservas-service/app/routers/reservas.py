from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas
from ..security import verify_token

router = APIRouter(
    prefix="/reservas",
    tags=["Reservas"]
)

@router.get("/", response_model=list[schemas.ReservaResponse])
def listar_reservas(db: Session = Depends(get_db), current_user = Depends(verify_token)):
    return crud.listar_reservas(db)


@router.get("/{id_reserva}", response_model=schemas.ReservaResponse)
def obtener_reserva(id_reserva: int, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    reserva = crud.obtener_reserva(db, id_reserva)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva


@router.post("/", response_model=schemas.ReservaResponse)
def crear_reserva(reserva: schemas.ReservaCreate,
                  db=Depends(get_db),
                  current_user = Depends(verify_token)):
    roles = current_user.get("roles", []) if isinstance(current_user, dict) else []
    canal = "Presencial" if any(r in roles for r in ("Administrador", "Empleado")) else "Online"
    nueva = crud.crear_reserva(db, reserva, canal=canal)
    return nueva


@router.post("/{id_reserva}/checkin", response_model=schemas.ReservaResponse)
def checkin_reserva(id_reserva: int,
                    db=Depends(get_db),
                    current_user = Depends(verify_token)):
    return crud.checkin_reserva(db, id_reserva)


@router.post("/{id_reserva}/checkout", response_model=schemas.ReservaResponse)
def checkout_reserva(id_reserva: int,
                     db=Depends(get_db),
                     current_user = Depends(verify_token)):
    return crud.checkout_reserva(db, id_reserva)