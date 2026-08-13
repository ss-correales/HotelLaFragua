from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas
from ..security import require_admin


router = APIRouter(prefix="/facturas", tags=["Facturación"])


@router.post("/", response_model=schemas.FacturaResponse)
def crear_factura(factura: schemas.FacturaCreate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return crud.crear_factura(db, factura)


@router.get("/", response_model=list[schemas.FacturaResponse])
def listar_facturas(db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return crud.listar_facturas(db)


@router.get("/{id_factura}", response_model=schemas.FacturaResponse)
def obtener_factura(id_factura: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    factura = crud.obtener_factura(db, id_factura)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return factura


@router.get("/reserva/{id_reserva}", response_model=list[schemas.FacturaResponse])
def facturas_reserva(id_reserva: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return crud.facturas_por_reserva(db, id_reserva)


@router.post("/{id_factura}/pagos", response_model=schemas.PagoResponse)
def registrar_pago(id_factura: int, pago: schemas.PagoCreate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    factura = crud.obtener_factura(db, id_factura)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return crud.crear_pago(db, id_factura, pago)


@router.get("/{id_factura}/pagos", response_model=list[schemas.PagoResponse])
def listar_pagos(id_factura: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    factura = crud.obtener_factura(db, id_factura)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return crud.listar_pagos_por_factura(db, id_factura)
