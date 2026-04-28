from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas
from ..security import create_access_token, verify_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(usuario: schemas.UsuarioCreate, db=Depends(get_db)):
    nuevo = crud.crear_usuario(db, usuario)
    if not nuevo:
        raise HTTPException(status_code=400, detail="Usuario ya existe")

    return {
        "id_usuario": nuevo.id_usuario,
        "nombre_usuario": nuevo.nombre_usuario,
        "correo": nuevo.correo,
        "numero_documento": nuevo.numero_documento,
        "estado": nuevo.estado,
        "roles": [rol.nombre for rol in nuevo.roles]
    }

@router.post("/login")
def login(datos: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    usuario = crud.autenticar_usuario(db, datos.correo, datos.contraseña)

    if not usuario:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = create_access_token({
        "sub": usuario.nombre_usuario,
        "id_usuario": usuario.id_usuario,
        "nombre_usuario": usuario.nombre_usuario,
        "correo": usuario.correo,
        "numero_documento": usuario.numero_documento,
        "roles": [rol.nombre for rol in usuario.roles]
    })

    return {"access_token": token, "token_type": "bearer"}

@router.post("/validate")
def validate_token(token: str):
    """Valida un token JWT"""
    payload = verify_token(token)
    return {
        "valid": True,
        "data": payload
    }

# Endpoints adicionales para gestión de usuarios
@router.get("/users", response_model=list[schemas.UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db), current_user = Depends(verify_token)):
    return crud.listar_usuarios(db)

@router.get("/users/{id_usuario}", response_model=schemas.UsuarioResponse)
def obtener_usuario(id_usuario: int, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    usuario = crud.obtener_usuario_por_id(db, id_usuario)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

@router.put("/users/{id_usuario}", response_model=schemas.UsuarioResponse)
def actualizar_usuario(id_usuario: int, usuario_update: schemas.UsuarioUpdate, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    usuario = crud.actualizar_usuario(db, id_usuario, usuario_update)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

@router.delete("/users/{id_usuario}")
def eliminar_usuario(id_usuario: int, db: Session = Depends(get_db), current_user = Depends(verify_token)):
    eliminado = crud.eliminar_usuario(db, id_usuario)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"mensaje": "Usuario eliminado"}

# Endpoints para roles
@router.post("/roles")
def crear_rol(nombre: str, db: Session = Depends(get_db)):
    rol = crud.crear_rol(db, nombre)
    if not rol:
        raise HTTPException(status_code=400, detail="Rol ya existe")
    return {"id_rol": rol.id_rol, "nombre": rol.nombre}

@router.get("/roles", response_model=list[schemas.Rol])
def listar_roles(db: Session = Depends(get_db)):
    return crud.listar_roles(db)
