from sqlalchemy.orm import Session
from . import models, schemas
from .database import SessionLocal
from datetime import datetime, timedelta
from typing import Optional

MINUTOS_LIMPIEZA = 30


# -----------------------------
# Listar todas las habitaciones
# -----------------------------
def get_habitaciones(db: Session):
    return db.query(models.Habitacion).all()


# -----------------------------
# Crear una habitación
# -----------------------------
def create_habitacion(db: Session, habitacion: schemas.HabitacionCreate):
    # Verificar si ya existe el numero_habitacion
    existente = db.query(models.Habitacion).filter(models.Habitacion.numero_habitacion == habitacion.numero_habitacion).first()
    if existente:
        return None  # Ya existe

    db_habitacion = models.Habitacion(
        numero_habitacion=habitacion.numero_habitacion,
        tipo_habitacion=habitacion.tipo_habitacion,
        descripcion=habitacion.descripcion,
        ocupacion=habitacion.ocupacion,
        numero_camas=habitacion.numero_camas,
        precio_base=habitacion.precio_base,
        estado=habitacion.estado,
        comodidades=habitacion.comodidades,
        foto=habitacion.foto
    )
    db.add(db_habitacion)
    db.commit()
    db.refresh(db_habitacion)
    return db_habitacion


# -----------------------------
# Actualizar una habitación
# -----------------------------
def update_habitacion(db: Session, numero_habitacion: int, data: schemas.HabitacionUpdate):
    db_habitacion = db.query(models.Habitacion).filter(models.Habitacion.numero_habitacion == numero_habitacion).first()
    if not db_habitacion:
        return None

    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_habitacion, key, value)

    if "estado" in update_data:
        if update_data["estado"] == "Limpieza":
            db_habitacion.limpieza_hasta = datetime.now() + timedelta(minutes=MINUTOS_LIMPIEZA)
        else:
            db_habitacion.limpieza_hasta = None

    db.commit()
    db.refresh(db_habitacion)
    return db_habitacion


# -----------------------------
# Liberar habitaciones cuya ventana de limpieza ya terminó
# -----------------------------
def liberar_habitaciones_limpieza(db: Session):
    vencidas = db.query(models.Habitacion).filter(
        models.Habitacion.estado == "Limpieza",
        models.Habitacion.limpieza_hasta <= datetime.now(),
    ).all()

    for habitacion in vencidas:
        habitacion.estado = "Libre"
        habitacion.limpieza_hasta = None

    db.commit()


def job_liberar_habitaciones_limpieza():
    """Wrapper para el scheduler: abre y cierra su propia sesión de DB."""
    db = SessionLocal()
    try:
        liberar_habitaciones_limpieza(db)
    finally:
        db.close()


# -----------------------------
# Eliminar una habitación
# -----------------------------
def delete_habitacion(db: Session, numero_habitacion: int):
    db_habitacion = db.query(models.Habitacion).filter(models.Habitacion.numero_habitacion == numero_habitacion).first()
    if db_habitacion:
        db.delete(db_habitacion)
        db.commit()
        return True
    return False


# -----------------------------
# Listar ocupaciones
# -----------------------------
def get_ocupaciones(db: Session):
    return db.query(models.OcupacionHabitacion).all()


# -----------------------------
# Listar ocupaciones activas
# -----------------------------
def get_ocupaciones_activas(db: Session):
    return db.query(models.OcupacionHabitacion).filter(models.OcupacionHabitacion.fecha_fin == None).all()


# -----------------------------
# Crear ocupación de habitación
# -----------------------------
from datetime import datetime


def _parse_datetime(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        # Requiere ISO-8601 o soporte `DD/MM/YYYY` simple
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            try:
                return datetime.strptime(value, "%d/%m/%Y")
            except ValueError:
                raise ValueError("fecha debe estar en formato ISO-8601 o DD/MM/YYYY")
    raise ValueError("fecha inválida")


def create_ocupacion(db: Session, ocupacion: schemas.OcupacionHabitacionCreate):
    fecha_inicio = _parse_datetime(ocupacion.fecha_inicio) or datetime.utcnow()
    fecha_fin = _parse_datetime(ocupacion.fecha_fin) if ocupacion.fecha_fin else None

    db_ocupacion = models.OcupacionHabitacion(
        numero_habitacion=ocupacion.numero_habitacion,
        identificacion_cliente=ocupacion.identificacion_cliente,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )
    db.add(db_ocupacion)
    db.commit()
    db.refresh(db_ocupacion)
    return db_ocupacion


# -----------------------------
# Finalizar ocupacion
# -----------------------------
def finalizar_ocupacion(db: Session, id: int, fecha_fin: Optional[datetime] = None):
    db_ocupacion = db.query(models.OcupacionHabitacion).filter(models.OcupacionHabitacion.id == id).first()
    if not db_ocupacion:
        return None
    db_ocupacion.fecha_fin = _parse_datetime(fecha_fin) if fecha_fin else datetime.utcnow()
    db.commit()
    db.refresh(db_ocupacion)
    return db_ocupacion
