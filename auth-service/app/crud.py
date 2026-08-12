from sqlalchemy.orm import Session, joinedload
from .models import Usuario, Rol
from .security import hash_password, verify_password

def crear_usuario(db: Session, usuario_data):
    """
    Crea un nuevo usuario con roles asignados
    """
    # Verificar si el usuario ya existe
    if db.query(Usuario).filter(
        (Usuario.nombre_usuario == usuario_data.nombre_usuario) |
        (Usuario.correo == usuario_data.correo)
    ).first():
        return None

    # Crear el usuario
    nuevo_usuario = Usuario(
        nombre_usuario=usuario_data.nombre_usuario,
        correo=usuario_data.correo,
        numero_documento=usuario_data.numero_documento,
        contraseña_hash=hash_password(usuario_data.contraseña),
        estado=True
    )

    # Asignar roles si se proporcionaron
    if usuario_data.roles:
        roles = db.query(Rol).filter(Rol.nombre.in_(usuario_data.roles)).all()
        nuevo_usuario.roles = roles

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

def obtener_usuario_por_correo(db: Session, correo: str):
    return db.query(Usuario).options(joinedload(Usuario.roles)).filter(Usuario.correo == correo).first()

def obtener_usuario_por_id(db: Session, id_usuario: int):
    return db.query(Usuario).options(joinedload(Usuario.roles)).filter(Usuario.id_usuario == id_usuario).first()

def autenticar_usuario(db: Session, correo: str, password: str):
    usuario = obtener_usuario_por_correo(db, correo)
    if not usuario or not usuario.estado:
        return None
    if not verify_password(password, usuario.contraseña_hash):
        return None
    return usuario

def listar_usuarios(db: Session):
    return db.query(Usuario).options(joinedload(Usuario.roles)).all()

def actualizar_usuario(db: Session, id_usuario: int, usuario_update):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        return None

    # Actualizar campos básicos
    if usuario_update.nombre_usuario is not None:
        usuario.nombre_usuario = usuario_update.nombre_usuario
    if usuario_update.correo is not None:
        usuario.correo = usuario_update.correo
    if usuario_update.estado is not None:
        usuario.estado = usuario_update.estado

    # Actualizar roles si se proporcionaron
    if usuario_update.roles is not None:
        roles = db.query(Rol).filter(Rol.nombre.in_(usuario_update.roles)).all()
        usuario.roles = roles

    db.commit()
    db.refresh(usuario)
    return usuario

def eliminar_usuario(db: Session, id_usuario: int):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if usuario:
        db.delete(usuario)
        db.commit()
        return True
    return False

# Funciones para roles
def crear_rol(db: Session, nombre: str):
    if db.query(Rol).filter(Rol.nombre == nombre).first():
        return None
    nuevo_rol = Rol(nombre=nombre)
    db.add(nuevo_rol)
    db.commit()
    db.refresh(nuevo_rol)
    return nuevo_rol

def listar_roles(db: Session):
    return db.query(Rol).all()
