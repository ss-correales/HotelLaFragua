from sqlalchemy.orm import Session
from .models import Empleado

def crear_empleado(db: Session, empleado):
    nuevo = Empleado(**empleado.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

def listar_empleados(db: Session):
    return db.query(Empleado).all()

def obtener_empleado(db: Session, id: int):
    return db.query(Empleado).filter(Empleado.id_empleado == id).first()

def actualizar_empleado(db: Session, id: int, empleado):
    emp = obtener_empleado(db, id)
    if not emp:
        return None

    for key, value in empleado.dict().items():
        setattr(emp, key, value)

    db.commit()
    db.refresh(emp)
    return emp

def eliminar_empleado(db: Session, id: int):
    emp = obtener_empleado(db, id)
    if not emp:
        return None

    db.delete(emp)
    db.commit()
    return emp
