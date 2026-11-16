# 🐳 Docker Compose - Guía de Uso

## ¿Qué es Docker Compose?

Docker Compose levanta **TODOS tus servicios con un solo comando**:
- MySQL (BD)
- Redis (Cache)
- RabbitMQ (Cola de mensajes)
- 6 Microservicios (Auth, Clientes, Habitaciones, Reservas, Facturación, Empleados)
- Frontend React
- Celery Worker (tareas asincrónicas)

---

## 📋 REQUISITOS

### 1. **Instalar Docker Desktop**
```bash
# macOS
https://www.docker.com/products/docker-desktop

# Linux
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 2. **Instalar Docker Compose** (usualmente viene con Docker Desktop)
```bash
docker-compose --version  # Si funciona, está listo
```

### 3. **Crear archivo .env**
```bash
# Copiar desde el ejemplo
cp .env.example .env

# Editar .env y cambiar valores sensibles:
nano .env
```

---

## 🚀 COMANDOS PRINCIPALES

### **Iniciar TODOS los servicios**
```bash
docker-compose up
```

**Nota:** Primera vez tarda 2-5 minutos (descarga imágenes, crea volúmenes)

### **Iniciar en background** (recomendado)
```bash
docker-compose up -d
```

### **Ver logs de un servicio**
```bash
docker-compose logs auth-service          # Últimas líneas
docker-compose logs -f auth-service       # Siguiendo en tiempo real (Ctrl+C para salir)
docker-compose logs -f --tail=50          # Últimas 50 líneas
```

### **Ver estado de todos los servicios**
```bash
docker-compose ps
```

**Output:**
```
NAME                   STATUS      PORTS
hotel_auth_service     Up 2 hours  0.0.0.0:8086->8000/tcp
hotel_clientes_service Up 2 hours  0.0.0.0:8081->8000/tcp
hotel_mysql            Up 2 hours  0.0.0.0:3306->3306/tcp
hotel_redis            Up 2 hours  0.0.0.0:6379->6379/tcp
hotel_rabbitmq         Up 2 hours  0.0.0.0:5672->5672/tcp, ...
```

### **Detener TODOS los servicios**
```bash
docker-compose stop
```

### **Detener y eliminar todo** (¡Cuidado con datos!)
```bash
docker-compose down
```

### **Eliminar también volúmenes** (elimina BD, Redis, etc.)
```bash
docker-compose down -v
```

### **Reiniciar un servicio específico**
```bash
docker-compose restart auth-service
```

### **Reconstruir imágenes** (después de cambios en Dockerfile)
```bash
docker-compose build
docker-compose up
```

---

## 🔍 ACCEDER A LOS SERVICIOS

### **Frontend React**
```
http://localhost:5173
```

### **API - Auth Service**
```
http://localhost:8086
http://localhost:8086/docs (Swagger UI)
```

### **API - Clientes Service**
```
http://localhost:8081
http://localhost:8081/docs
```

### **API - Habitaciones Service**
```
http://localhost:8082
http://localhost:8082/docs
```

### **API - Reservas Service**
```
http://localhost:8083
http://localhost:8083/docs
```

### **API - Facturación Service**
```
http://localhost:8084
http://localhost:8084/docs
```

### **API - Empleados Service**
```
http://localhost:8085
http://localhost:8085/docs
```

### **RabbitMQ Management UI**
```
http://localhost:15672
Usuario: guest
Password: guest
```

### **Redis Commander** (Opcional - para ver datos en Redis)
```bash
# Instalar
npm install -g redis-commander

# Ejecutar (en otra terminal)
redis-commander

# Acceder a
http://localhost:8081
```

---

## 🐧 CONECTAR MySQL Workbench A DOCKER

### **Paso 1: Asegúrate que MySQL esté corriendo**
```bash
docker-compose ps | grep mysql
```

### **Paso 2: En MySQL Workbench - Nueva Conexión**
```
Connection Name: Docker Hotel
Hostname: 127.0.0.1 (o localhost)
Port: 3306
Username: root
Password: root_password (del .env)
Default Schema: hotel_erp
```

### **Paso 3: Test Connection**
Click en "Test Connection" → Debe funcionar

---

## 🔄 FLUJO DE DESARROLLO CON DOCKER

### **Escenario: Estás trabajando en auth-service**

```bash
# 1. Iniciar todo
docker-compose up -d

# 2. Ver logs del servicio que estoy desarrollando
docker-compose logs -f auth-service

# 3. Editar código en auth-service/ (cambios se actualizan automático)

# 4. Si cambias requirements.txt:
docker-compose restart auth-service

# 5. Si cambias Dockerfile:
docker-compose up -d --build auth-service
```

### **Escenario: Cambias estructura de BD**

```bash
# 1. Editar models.py en un servicio

# 2. Con Alembic (próxima sección):
docker-compose exec auth-service alembic revision --autogenerate -m "Descripción cambio"

# 3. Aplicar migración:
docker-compose exec auth-service alembic upgrade head

# 4. Otros devs descargan tu rama:
git pull
docker-compose restart  # Aplica migraciones automáticamente
```

---

## 🗑️ TROUBLESHOOTING

### **Puerto ya en uso**
```bash
# Si Puerto 3306 está en uso:
# Opción 1: Cambiar en docker-compose.yml
  ports:
    - "3307:3306"  # Usa 3307 en vez de 3306

# Opción 2: Detener servicio conflictivo
lsof -i :3306
kill -9 [PID]
```

### **Contenedor no inicia**
```bash
docker-compose logs [nombre_servicio]  # Ver error específico

# Ejemplo
docker-compose logs auth-service
```

### **Cambios de código no se aplican**
```bash
# Los servicios tienen "reload=true" en docker-compose.yml
# Si no funciona:
docker-compose restart [servicio]

# O reconstruir:
docker-compose up -d --build [servicio]
```

### **Redis no conecta**
```bash
# Probar conexión
docker-compose exec redis redis-cli ping

# Debe responder: PONG
```

### **MySQL no inicializa correctamente**
```bash
# Eliminar volumen y reiniciar (⚠️ Perderas datos)
docker-compose down -v
docker-compose up mysql
```

---

## ✅ CONFIGURACIÓN PLANETSCALE (Alternativa a Docker MySQL)

Si prefieres usar **PlanetScale en la nube** en vez de MySQL local:

### **Paso 1: Crear cuenta en PlanetScale**
```
https://planetscale.com
Sign up gratuito
```

### **Paso 2: Crear BD "hotel_erp"**
- New Database → hotel_erp
- Copy Connection String

### **Paso 3: Actualizar .env**
```
# Reemplaza esto:
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=root_password

# Con esto:
MYSQL_HOST=aws.connect.psdb.cloud
MYSQL_USER=root
MYSQL_PASSWORD=pscale_pw_xxxxx
MYSQL_PORT=3306
MYSQL_DB=hotel_erp
```

### **Paso 4: Comentar MySQL en docker-compose.yml**
```yaml
# mysql:
#   image: mysql:8.0-debian
#   ...
```

### **Paso 5: Reiniciar servicios**
```bash
docker-compose restart
```

Ahora todos usan PlanetScale en la nube, sin costos.

---

## 📊 ESTRUCTURA DE VOLÚMENES

Docker Compose crea 3 volúmenes para persistencia:

```
mysql_data/      → Datos de base de datos
redis_data/      → Datos de Redis (cache)
rabbitmq_data/   → Datos de RabbitMQ (colas)
```

**Ubicación real:**
```bash
# macOS/Linux
ls /var/lib/docker/volumes/

# Ver contenido
docker-compose exec mysql ls /var/lib/mysql
```

---

## 🔐 SEGURIDAD EN PRODUCCIÓN

Cambiar ANTES de deploying:

```yaml
# docker-compose.yml
environment:
  MYSQL_PASSWORD: ❌ root_password  → ✅ contraseña_segura_64_caracteres
  RABBITMQ_DEFAULT_PASS: ❌ guest  → ✅ contraseña_segura
  SECRET_KEY: ❌ hardcoded         → ✅ generar con openssl
```

```bash
# Generar SECRET_KEY seguro
openssl rand -hex 32
```

---

## 📝 RESUMEN - 3 COMANDOS PRINCIPALES

```bash
# 1. Iniciar todo
docker-compose up -d

# 2. Ver estado
docker-compose ps

# 3. Ver logs (para debugging)
docker-compose logs -f [servicio]
```

---

¡Listo! Ahora tienes un ambiente desarrollo profesional y reproducible.
