# Guía de Ejecución con Docker Compose

Esta guía explica cómo levantar **Hotel La Fragua** con `docker compose` en el escenario actual del proyecto:

- los microservicios y el frontend sí corren en contenedores,
- la base de datos MySQL **no** corre en Docker,
- la conexión MySQL se hace contra **Railway** usando los `DATABASE_URL` ya definidos por microservicio.

---

## 1. Qué levanta `docker compose`

El archivo [docker-compose.yml](/Users/sofiacorreales/Desktop/HotelLaFragua/docker-compose.yml:1) inicia estos contenedores:

- `auth-service`
- `clientes-service`
- `habitaciones-service`
- `reservas-service`
- `facturacion-service`
- `empleados-service`
- `frontend`

Importante:

- `mysql` **no** forma parte del compose.
- no se crea ninguna base local.
- cada microservicio usa su propia variable `DATABASE_URL` para conectarse a Railway.

---

## 2. Qué archivos `.env` usa el proyecto

El proyecto usa dos niveles de configuración:

### Archivo global en raíz

El archivo [/.env](/Users/sofiacorreales/Desktop/HotelLaFragua/.env:1) contiene variables compartidas, por ejemplo:

- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `AUTH_ENABLED`
- `CORS_ORIGINS`
- `VITE_AUTH_SERVICE_URL`
- `VITE_CLIENTES_SERVICE_URL`
- `VITE_HABITACIONES_SERVICE_URL`
- `VITE_RESERVAS_SERVICE_URL`

### Archivo `.env` por microservicio

Cada backend tiene su propio `.env` con su `DATABASE_URL`:

- [auth-service/.env](/Users/sofiacorreales/Desktop/HotelLaFragua/auth-service/.env:1)
- [clientes-service/.env](/Users/sofiacorreales/Desktop/HotelLaFragua/clientes-service/.env:1)
- [habitaciones-service/.env](/Users/sofiacorreales/Desktop/HotelLaFragua/habitaciones-service/.env:1)
- [reservas-service/.env](/Users/sofiacorreales/Desktop/HotelLaFragua/reservas-service/.env:1)
- [facturacion-service/.env](/Users/sofiacorreales/Desktop/HotelLaFragua/facturacion-service/.env:1)
- [empleados-service/.env](/Users/sofiacorreales/Desktop/HotelLaFragua/empleados-service/.env:1)

Esos archivos deben apuntar a Railway con una URL válida tipo:

```text
DATABASE_URL=mysql+pymysql://usuario:password@host:puerto/base_de_datos
```

---

## 3. Requisitos previos

Cada integrante debe tener instalado:

- Docker Desktop
- Docker Compose

Verificación:

```bash
docker --version
docker compose version
```

Además:

- deben tener acceso a las bases en Railway,
- los `DATABASE_URL` no deben estar vacíos,
- Railway debe aceptar conexiones desde su entorno local.

---

## 4. Antes de levantar el proyecto

Revisen estas dos cosas:

### 4.1 Variables globales

Confirmen que el archivo raíz `/.env` tenga como mínimo:

- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `AUTH_ENABLED`
- `CORS_ORIGINS`

### 4.2 Variables de base de datos

Confirmen que cada microservicio tenga su `DATABASE_URL` correcto.

Ejemplo:

```text
DATABASE_URL=mysql+pymysql://...
```

Si un `DATABASE_URL` está mal:

- el contenedor sí puede arrancar,
- pero el servicio fallará al intentar conectarse a Railway.

---

## 5. Cómo levantar el proyecto

Desde la raíz del repositorio:

```bash
docker compose up --build
```

Este comando:

1. construye las imágenes,
2. levanta los microservicios,
3. levanta el frontend,
4. conecta cada backend a Railway usando su `DATABASE_URL`.

La primera vez puede tardar porque Docker instala dependencias de Python y Node.

---

## 6. Cómo levantarlo en segundo plano

```bash
docker compose up --build -d
```

Luego pueden revisar logs:

```bash
docker compose logs -f
```

O logs de un servicio puntual:

```bash
docker compose logs -f auth-service
docker compose logs -f reservas-service
docker compose logs -f frontend
```

---

## 7. URLs del sistema

Cuando todo está arriba:

- Frontend: `http://localhost:5173`
- Auth Service: `http://localhost:8086`
- Clientes Service: `http://localhost:8081`
- Habitaciones Service: `http://localhost:8082`
- Reservas Service: `http://localhost:8083`
- Facturación Service: `http://localhost:8084`
- Empleados Service: `http://localhost:8085`

Importante:

- esas URLs son locales para acceder a los contenedores,
- pero los datos vienen de Railway,
- por eso no existe `localhost:3306` dentro de este flujo de trabajo.

---

## 8. Cómo detener el proyecto

```bash
docker compose down
```

Como MySQL no está en Docker:

- no hay volumen local de base que borrar,
- este comando solo detiene y elimina contenedores de aplicación.

---

## 9. Cómo reconstruir un servicio

Si cambian código en un microservicio:

```bash
docker compose build auth-service
docker compose up -d auth-service
```

Ejemplos:

```bash
docker compose build frontend
docker compose up -d frontend

docker compose build reservas-service
docker compose up -d reservas-service
```

---

## 10. Cómo verificar que todo subió bien

### Ver contenedores

```bash
docker compose ps
```

### Validar el compose

```bash
docker compose config
```

### Probar endpoints rápidos

```bash
curl http://localhost:8086/
curl http://localhost:8082/
curl http://localhost:8083/
```

Si responden con JSON, el contenedor está vivo.

Eso no garantiza todavía que Railway esté bien configurado, pero sí que el servicio arrancó.

---

## 11. Problemas comunes

### Error de conexión a base de datos

Si un servicio arranca pero luego falla con errores de conexión:

- revisen el `DATABASE_URL` de ese microservicio,
- verifiquen usuario, contraseña, host, puerto y nombre de la base,
- revisen si Railway permite la conexión desde su red actual.

Logs útiles:

```bash
docker compose logs -f auth-service
docker compose logs -f clientes-service
docker compose logs -f reservas-service
```

### Puerto ocupado

Si Docker dice que un puerto ya está en uso:

```bash
lsof -i :5173
lsof -i :8081
lsof -i :8086
```

Solución:

- cerrar el proceso que esté usando ese puerto, o
- cambiar el puerto publicado en `docker-compose.yml`.

### Error de token inválido

Normalmente significa que:

- cambió `SECRET_KEY`,
- el navegador guarda un token viejo en `localStorage`,
- algún servicio arrancó con variables diferentes.

Recomendación:

1. borrar `localStorage`,
2. verificar `SECRET_KEY` en el archivo raíz `.env`,
3. reiniciar los contenedores.

### El frontend abre pero no carga datos

Revisen:

- que los servicios estén arriba,
- que el `DATABASE_URL` del backend correspondiente sea correcto,
- que Railway esté accesible,
- que no haya errores CORS o JWT en logs.

Comando útil:

```bash
docker compose logs -f frontend auth-service clientes-service habitaciones-service reservas-service
```

---

## 12. Flujo recomendado para el equipo

1. Hacer `git pull`.
2. Revisar el archivo raíz `.env`.
3. Revisar el `.env` del microservicio si se cambió una conexión.
4. Ejecutar:

```bash
docker compose up --build -d
```

5. Confirmar:

```bash
docker compose ps
```

6. Abrir:

```text
http://localhost:5173
```

7. Si algo falla, revisar logs del servicio puntual.

---

## 13. Comandos más usados

```bash
docker compose up --build
docker compose up --build -d
docker compose ps
docker compose logs -f
docker compose logs -f auth-service
docker compose logs -f frontend
docker compose down
docker compose build frontend
docker compose up -d frontend
docker compose config
```

---

## 14. Nota importante sobre Railway

En este proyecto, Docker solo empaqueta y ejecuta la aplicación.

La base de datos:

- no se crea localmente,
- no se reinicia con `docker compose down`,
- no se borra con comandos de Docker,
- depende completamente de las credenciales y disponibilidad de Railway.

Eso significa que un error de datos o de estructura en la base no se arregla reiniciando contenedores.

---

## 15. Resumen corto

Si solo quieren la versión rápida:

1. Verifiquen `.env` raíz y `DATABASE_URL` por servicio.
2. Ejecuten:

```bash
docker compose up --build -d
```

3. Revisen:

```bash
docker compose ps
docker compose logs -f
```

4. Entren al frontend:

```text
http://localhost:5173
```

