from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas
from .. security import verify_token


router = APIRouter(prefix="/facturas", tags=["Facturación"])


@router.post("/", response_model=schemas.FacturaResponse)
def crear_factura(factura: schemas.FacturaCreate, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    return crud.crear_factura(db, factura)


@router.get("/", response_model=list[schemas.FacturaResponse])
def listar_facturas(db: Session = Depends(get_db), current_user = Depends(verify_token)):
    return crud.listar_facturas(db)


@router.get("/{id}", response_model=schemas.FacturaResponse)
def obtener_factura(id: int, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    factura = crud.obtener_factura(db, id)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return factura


@router.get("/cliente/{cliente_id}", response_model=list[schemas.FacturaResponse])
def facturas_cliente(cliente_id: int, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    return crud.facturas_por_cliente(db, cliente_id)
