# QUICK START - Hotel La Fragua ERP

## 🚀 Iniciar en 3 Pasos

### 1. Instalar Docker Desktop
```bash
# macOS
https://www.docker.com/products/docker-desktop

# Linux
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
```

### 2. Crear archivo .env
```bash
cp .env.example .env
```

### 3. Iniciar todo
```bash
docker-compose up
```

**Listo! Todos los servicios corren en ~2-5 minutos**

---

## 🌐 Acceder a los Servicios

| Servicio | URL | Documentación |
|----------|-----|---------------|
| Frontend | http://localhost:5173 | - |
| Auth API | http://localhost:8086 | http://localhost:8086/docs |
| Clientes API | http://localhost:8081 | http://localhost:8081/docs |
| Habitaciones API | http://localhost:8082 | http://localhost:8082/docs |
| Reservas API | http://localhost:8083 | http://localhost:8083/docs |
| Facturación API | http://localhost:8084 | http://localhost:8084/docs |
| Empleados API | http://localhost:8085 | http://localhost:8085/docs |
| RabbitMQ UI | http://localhost:15672 | usuario: guest, pass: guest |

---

## 💾 Usar PlanetScale (BD en Nube - Gratuita)

### ¿Por qué?
- ✅ Gratuito para siempre
- ✅ BD compartida entre 3 devs
- ✅ Ramas como Git
- ✅ No más gastos de Railway

### Setup (5 minutos)

1. **Crear cuenta**
   ```
   https://planetscale.com → Sign up
   ```

2. **Crear BD "hotel_erp"**
   - New Database → hotel_erp
   - Copy MySQL connection string

3. **Actualizar .env**
   ```env
   MYSQL_HOST=aws.connect.psdb.cloud
   MYSQL_USER=root
   MYSQL_PASSWORD=pscale_pw_xxxxx
   MYSQL_PORT=3306
   MYSQL_DB=hotel_erp
   ```

4. **Comentar MySQL en docker-compose.yml**
   ```yaml
   # mysql:
   #   image: mysql:8.0-debian
   #   ...
   ```

5. **Reiniciar**
   ```bash
   docker-compose restart
   ```

---

## 🗄️ Alembic - Migraciones de BD

### Problema Que Solucionamos
Están 3 devs haciendo cambios en BD simultáneamente sin perder datos.

### Workflow

```bash
# 1. Cambiar modelo
nano auth-service/app/models.py
# Agregar nueva columna

# 2. Crear migración
cd auth-service
alembic revision --autogenerate -m "Descripción del cambio"

# 3. Probar localmente
alembic upgrade head

# 4. Commit y push
git add alembic/versions/
git commit -m "Add new field to usuarios"
git push

# 5. En Pull Request → otros ven cambios automáticamente
```

**Más detalles:** Ver [ALEMBIC_PLANETSCALE_GUIDE.md](ALEMBIC_PLANETSCALE_GUIDE.md)

---

## 🐳 Docker Compose Comandos Útiles

```bash
# Ver estado
docker-compose ps

# Ver logs de un servicio
docker-compose logs -f auth-service

# Detener todo
docker-compose stop

# Reiniciar un servicio
docker-compose restart auth-service

# Ejecutar comando en contenedor
docker-compose exec auth-service bash

# Guía completa
# Ver: DOCKER_GUIDE.md
```

---

## 📚 Documentación Completa

- **[DOCKER_GUIDE.md](DOCKER_GUIDE.md)** - Docker Compose en detalle
- **[ALEMBIC_PLANETSCALE_GUIDE.md](ALEMBIC_PLANETSCALE_GUIDE.md)** - Migraciones de BD en equipo
- **[README.md](README.md)** - Descripción general del proyecto

---

## 🔧 Tecnologías Incluidas

- **Backend:** FastAPI, SQLAlchemy, Pydantic v2
- **BD:** MySQL (local) o PlanetScale (nube)
- **Cache:** Redis
- **Colas:** RabbitMQ + Celery
- **Frontend:** React 18, Vite
- **Migraciones:** Alembic
- **Testing:** Pytest
- **Containerización:** Docker + Docker Compose

---

## 📋 Checklist Inicial

- [ ] Instalar Docker Desktop
- [ ] Crear .env desde .env.example
- [ ] `docker-compose up` exitoso
- [ ] Acceder a http://localhost:5173 (Frontend)
- [ ] Revisar http://localhost:8086/docs (Swagger)
- [ ] (Opcional) Crear cuenta en PlanetScale

---

## ❓ Troubleshooting

**Puerto en uso:**
```bash
# Cambiar en .env o docker-compose.yml
MYSQL_PORT=3307  # en vez de 3306
```

**Servicio no inicia:**
```bash
docker-compose logs [servicio]  # Ver error
docker-compose down -v          # Limpiar todo
docker-compose up               # Reintentar
```

**Cambios no se aplican:**
```bash
docker-compose restart [servicio]
# o reconstruir
docker-compose up -d --build [servicio]
```

---

## 🚀 Next Steps

1. **Hoy:** Docker + Redis + PlanetScale
2. **Mañana:** Alembic + Tests
3. **Semana 2:** Celery + RabbitMQ (tareas async)
4. **Semana 3:** Logging + Sentry (error tracking)

---

¡Listo para empezar! 🎉

Si tienes dudas, revisa la documentación específica o abre un issue.
