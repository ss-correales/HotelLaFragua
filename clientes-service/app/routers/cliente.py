from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas
from app.security import verify_token, require_admin

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.post("/", response_model=schemas.Cliente)
def crear_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    nuevo = crud.crear_cliente(db, cliente)

    if not nuevo:
        raise HTTPException(status_code=400, detail="Cliente ya existe")

    return nuevo

@router.get("/", response_model=list[schemas.Cliente])
def listar_clientes(db: Session = Depends(get_db), current_user = Depends(verify_token)):
    return crud.get_clientes(db)

@router.get("/documento/{numero_documento}", response_model=schemas.Cliente)
def obtener_cliente_por_documento(numero_documento: str, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    cliente = crud.get_cliente_por_documento(db, numero_documento)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.get("/correo/{correo}", response_model=schemas.Cliente)
def obtener_cliente_por_correo(correo: str, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    cliente = crud.get_cliente_por_correo(db, correo)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.put("/{cliente_id}", response_model=schemas.Cliente)
def actualizar_cliente(cliente_id: int, cliente_update: schemas.ClienteUpdate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    cliente = crud.update_cliente(db, cliente_id, cliente_update)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.delete("/{cliente_id}")
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    eliminado = crud.delete_cliente(db, cliente_id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"mensaje": "Cliente eliminado"}

