from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas
from ..security import verify_token

router = APIRouter(prefix="/empleados", tags=["Empleados"])

@router.post("/", response_model=schemas.EmpleadoResponse)
def crear_empleado(empleado: schemas.EmpleadoCreate, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    return crud.crear_empleado(db, empleado)

@router.get("/", response_model=list[schemas.EmpleadoResponse])
def listar_empleados(db: Session = Depends(get_db), current_user = Depends(verify_token)):
    return crud.listar_empleados(db)

@router.get("/{id}", response_model=schemas.EmpleadoResponse)
def obtener_empleado(id: int, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    emp = crud.obtener_empleado(db, id)
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return emp

@router.put("/{id}", response_model=schemas.EmpleadoResponse)
def actualizar_empleado(id: int, empleado: schemas.EmpleadoCreate, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    emp = crud.actualizar_empleado(db, id, empleado)
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return emp

@router.delete("/{id}")
def eliminar_empleado(id: int, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    emp = crud.eliminar_empleado(db, id)
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return {"mensaje": "Empleado eliminado"}
