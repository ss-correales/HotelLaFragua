# Hotel La Fragua — Sistema ERP

Proyecto académico de microservicios para la gestión operativa de un hotel.
Cada módulo corre como un servicio independiente con su propia base de datos.

---

## Estructura

```
HotelLaFragua/
├── auth-service/          # Autenticación y usuarios (puerto 8086)
├── clientes-service/      # Gestión de clientes (puerto 8081)
├── habitaciones-service/  # Habitaciones y ocupaciones (puerto 8082)
├── reservas-service/      # Reservas con scheduler automático (puerto 8083)
├── facturacion-service/   # Facturación (puerto 8084)
├── empleados-service/     # Empleados (puerto 8085)
├── front-web/             # Frontend React/Vite (puerto 5173)
└── docker-compose.yml
```

Cada servicio tiene la misma estructura interna:
```
servicio/
├── app/
│   ├── main.py        # Punto de entrada, configuración de FastAPI y CORS
│   ├── database.py    # Conexión a MySQL con SQLAlchemy
│   ├── models.py      # Tablas de la base de datos (clases Python → tablas SQL)
│   ├── schemas.py     # Validación de datos de entrada/salida (Pydantic)
│   ├── crud.py        # Operaciones a la base de datos (crear, leer, actualizar, eliminar)
│   ├── security.py    # Validación de tokens JWT
│   └── routers/       # Endpoints de la API
├── Dockerfile
└── requirements.txt
```

---

## Cómo correr el proyecto

**Requisito:** tener Docker Desktop instalado y corriendo.

```bash
git clone https://github.com/sofiaaac111/HotelLaFragua.git
cd HotelLaFragua
```

Crea un archivo `.env` en la raíz (pídele el archivo al equipo, no está en el repositorio por seguridad).

```bash
docker compose up --build
```

Los servicios quedan disponibles en los puertos indicados. El frontend en http://localhost:5173.

> Con hot-reload activo: cualquier cambio en el código se aplica automáticamente sin reconstruir.

---

## Autenticación (JWT)

1. El usuario se registra o inicia sesión en `auth-service`
2. Recibe un `access_token`
3. Lo envía en cada petición: `Authorization: Bearer <token>`
4. Cada servicio valida el token antes de responder

---

## Endpoints principales

| Servicio       | Prefijo      | Acciones                              |
|----------------|--------------|---------------------------------------|
| auth-service   | `/auth`      | `/login`, `/register`, `/users`       |
| clientes       | `/clientes`  | CRUD clientes, buscar por correo      |
| habitaciones   | `/api/habitaciones` | CRUD habitaciones y ocupaciones |
| reservas       | `/reservas`  | CRUD reservas, check-in, check-out    |
| facturacion    | `/facturas`  | Crear y consultar facturas            |
| empleados      | `/empleados` | CRUD empleados                        |

Cada servicio expone documentación interactiva en `/docs` (ej: http://localhost:8081/docs).

---

## Tecnologías

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, MySQL (Railway)
- **Auth:** JWT con python-jose, contraseñas con passlib/bcrypt
- **Frontend:** React 18, Vite, Bootstrap 5, Axios
- **Infraestructura:** Docker, Docker Compose

---

## Autores

Melany Sofía Gordillo Puentes · Keiry Lucía Olaya Noguera · Sara Sofía Correales Mosquera

Ingeniería de Software — Proyecto de grado
