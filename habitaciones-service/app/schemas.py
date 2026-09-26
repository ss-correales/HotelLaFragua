from pydantic import BaseModel, field_validator
from typing import Literal, Optional
from datetime import datetime


# -----------------------------
# Base: Campos generales
# -----------------------------
class HabitacionBase(BaseModel):
    numero_habitacion: int
    tipo_habitacion: Literal["Individual", "Doble", "Familiar", "Suite"]
    descripcion: Optional[str] = None
    ocupacion: int
    numero_camas: int
    precio_base: float
    estado: Literal["Libre", "Ocupada", "Limpieza", "Mantenimiento"]
    comodidades: Optional[list[str]] = None
    foto: Optional[str] = None

    # Validación: Precio positivo
    @field_validator("precio_base")
    def precio_no_negativo(cls, v):
        if v < 0:
            raise ValueError("El precio base no puede ser negativo")
        return v

    # Validación: Ocupación positiva
    @field_validator("ocupacion")
    def ocupacion_positiva(cls, v):
        if v <= 0:
            raise ValueError("La ocupación debe ser mayor a 0")
        return v

    # Validación: Número de camas positivo
    @field_validator("numero_camas")
    def camas_positivas(cls, v):
        if v <= 0:
            raise ValueError("El número de camas debe ser mayor a 0")
        return v


# -----------------------------
# Crear habitación
# -----------------------------
class HabitacionCreate(BaseModel):
    numero_habitacion: int
    tipo_habitacion: Literal["Individual", "Doble", "Familiar", "Suite"]
    descripcion: Optional[str] = None
    ocupacion: int
    numero_camas: int
    precio_base: float
    estado: Optional[Literal["Libre", "Ocupada", "Limpieza", "Mantenimiento"]] = "Libre"
    comodidades: Optional[list[str]] = None
    foto: Optional[str] = None

    @field_validator("precio_base")
    def precio_no_negativo(cls, v):
        if v < 0:
            raise ValueError("El precio base no puede ser negativo")
        return v

    @field_validator("ocupacion")
    def ocupacion_positiva(cls, v):
        if v <= 0:
            raise ValueError("La ocupación debe ser mayor a 0")
        return v

    @field_validator("numero_camas")
    def camas_positivas(cls, v):
        if v <= 0:
            raise ValueError("El número de camas debe ser mayor a 0")
        return v


# -----------------------------
# Actualizar habitación
# -----------------------------
class HabitacionUpdate(BaseModel):
    tipo_habitacion: Optional[Literal["Individual", "Doble", "Familiar", "Suite"]] = None
    descripcion: Optional[str] = None
    ocupacion: Optional[int] = None
    numero_camas: Optional[int] = None
    precio_base: Optional[float] = None
    estado: Optional[Literal["Libre", "Ocupada", "Limpieza", "Mantenimiento"]] = None
    comodidades: Optional[list[str]] = None
    foto: Optional[str] = None

    @field_validator("precio_base")
    def precio_no_negativo(cls, v):
        if v is not None and v < 0:
            raise ValueError("El precio base no puede ser negativo")
        return v

    @field_validator("ocupacion")
    def ocupacion_positiva(cls, v):
        if v is not None and v <= 0:
            raise ValueError("La ocupación debe ser mayor a 0")
        return v

    @field_validator("numero_camas")
    def camas_positivas(cls, v):
        if v is not None and v <= 0:
            raise ValueError("El número de camas debe ser mayor a 0")
        return v


# -----------------------------
# Respuesta al cliente
# -----------------------------
class Habitacion(HabitacionBase):
    limpieza_hasta: Optional[datetime] = None

    model_config = {"from_attributes": True}


# -----------------------------
# Ocupacion de habitacion
# -----------------------------
class OcupacionHabitacionBase(BaseModel):
    numero_habitacion: int
    identificacion_cliente: int
    estado: Literal["Ocupada", "Finalizada"] = "Ocupada"
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None


class OcupacionHabitacionCreate(OcupacionHabitacionBase):
    pass


class OcupacionHabitacionUpdate(BaseModel):
    estado: Optional[Literal["Ocupada", "Finalizada"]] = None
    fecha_fin: Optional[datetime] = None


class OcupacionHabitacion(OcupacionHabitacionBase):
    id: int

    model_config = {"from_attributes": True}
