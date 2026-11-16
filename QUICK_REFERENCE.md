# 🎯 QUICK REFERENCE - COMANDOS DIARIOS

## ⚡ STARTUP (Primera vez del día)

```bash
# 1. Ir al proyecto
cd ~/Desktop/HotelLaFragua

# 2. Iniciar Docker (si no está corriendo)
docker-compose up -d

# 3. Verificar que todo esté arriba
docker-compose ps

# 4. Ver logs si algo falla
docker-compose logs -f
```

**Tiempo esperado:** 15-20 segundos ⏱️

---

## 🛑 SHUTDOWN (Final del día)

```bash
# 1. Parar todo pero conservar datos
docker-compose stop

# O parar y limpiar (volúmenes se mantienen)
docker-compose down
```

---

## 🔍 DIAGNOSTICAR PROBLEMAS

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs específico
docker-compose logs [servicio]
# Ejemplos:
docker-compose logs mysql
docker-compose logs auth-service
docker-compose logs redis

# Ver logs en tiempo real
docker-compose logs -f [servicio]

# Seguir logs de todo
docker-compose logs -f

# Último error en MySQL
docker-compose logs mysql | tail -20

# Último error en API
docker-compose logs auth-service | tail -20
```

---

## 🗄️ MYSQL WORKBENCH - CONEXIÓN RÁPIDA

```
Host:      
Port:     3307
User:     root
Password: sofiasoft123
Schema:   hotel_erp

O por terminal:
mysql -h 127.0.0.1 -P 3307 -u root -psofiasoft123 hotel_erp
```

---

## 🌐 ACCESO A SERVICIOS

```
Frontend:              http://localhost:5173
Auth API Docs:         http://localhost:8086/docs
Clientes API Docs:     http://localhost:8081/docs
Habitaciones Docs:     http://localhost:8082/docs
Reservas API Docs:     http://localhost:8083/docs
Facturación Docs:      http://localhost:8084/docs
Empleados API Docs:    http://localhost:8085/docs
RabbitMQ Web:          http://localhost:15672 (guest/guest)
```

---

## 💾 GIT + RAMAS (Para 3 devs)

```bash
# Crear tu rama personal
git checkout -b sofia/feature-name

# Ver cambios
git status
git diff

# Commit
git add .
git commit -m "Descripción clara"

# Push
git push origin sofia/feature-name

# Volver a main
git checkout main
git pull
```

**Regla:** Cada dev en su rama, main siempre clean ✅

---

## 📦 BD - MIGRACIONES (Después de cambios en models.py)

```bash
# 1. Generar migración automática
cd [servicio] # Ej: cd auth-service
alembic revision --autogenerate -m "Descripción del cambio"

# 2. Aplicar migración
alembic upgrade head

# 3. Ver historial
alembic history

# 4. Volver a versión anterior (si falla)
alembic downgrade -1
```

---

## 🧪 TESTS (Pytest)

```bash
# Instalar dependencias (primera vez)
pip install -r requirements.txt

# Ejecutar tests
pytest

# Tests con coverage
pytest --cov=app

# Tests específico
pytest tests/test_auth.py

# Tests con output detallado
pytest -v

# Parar en primer error
pytest -x
```

---

## 🔧 CAMBIOS EN CÓDIGO

```bash
# Si cambias código Python:
# ✅ Se recarga automático en FastAPI (--reload)
# Solo refresca el navegador

# Si cambias requirements.txt:
docker-compose rebuild [servicio]
docker-compose up -d

# Si cambias docker-compose.yml:
docker-compose down -v
docker-compose up -d

# Si cambias .env:
docker-compose restart
```

---

## 🐛 SI ALGO NO FUNCIONA

### ❌ MySQL: "Access denied for user 'root'"

**Problema:** Datos viejos en volumen Docker

**Solución rápida (SIEMPRE funciona):**
```bash
docker-compose down -v          # Limpia todo
docker-compose up -d            # Recrea limpio
sleep 20                        # Espera MySQL
docker-compose ps               # Verifica "Up (healthy)"
```

Luego prueba MySQL Workbench de nuevo.

---

### Opción 1: Reinicio limpio
```bash
docker-compose down -v
docker-compose up -d
sleep 15
docker-compose ps
```

### Opción 2: Ver logs del servicio fallido
```bash
docker-compose logs [servicio] | tail -30
```

### Opción 3: Ejecutar comando en contenedor
```bash
docker-compose exec [servicio] bash
# Ahora estás dentro del contenedor
ls -la
cat app/main.py
exit
```

### Opción 4: Consultar documentación
- Ver **TROUBLESHOOTING.md** (30+ problemas resueltos)
- Ver **DOCKER_GUIDE.md** (guía completa de Docker)

---

## 📝 CREDENCIALES (Confidencial)

| Servicio | User | Pass | Host:Port |
|----------|------|------|-----------|
| MySQL | root | sofiasoft123 | 127.0.0.1:3307 |
| Redis | - | redis123 | localhost:6379 |
| RabbitMQ | guest | guest | localhost:5672 |

⚠️ **NO subir credenciales a Git**

---

## 🎯 FLUJO TÍPICO DE DESARROLLO

```
1. docker-compose up -d          (Morning)
2. git pull origin main
3. git checkout -b sofia/feature
4. Editar código
5. pytest (testing)
6. git commit && git push
7. Crear Pull Request
8. Code Review con otro dev
9. Merge a main
10. docker-compose stop         (Evening)
```

---

## 📊 ESTRUCTURA DE PROYECTO

```
HotelLaFragua/                    ← ROOT
├─ docker-compose.yml            ← LEVANTA TODO
├─ .env                          ← CREDENCIALES (NO SUBIR)
├─ .gitignore                    ← Qué ignorar
│
├─ auth-service/                 ← API Auth
│  ├─ app/main.py
│  ├─ app/models.py
│  ├─ alembic/                   ← Migraciones BD
│  └─ requirements.txt
│
├─ clientes-service/             ← API Clientes
├─ habitaciones-service/         ← API Habitaciones
├─ reservas-service/             ← API Reservas
├─ facturacion-service/          ← API Facturación
├─ empleados-service/            ← API Empleados
│
├─ front-web/hotel-frontend/     ← React Frontend
│  ├─ src/
│  ├─ package.json
│  └─ vite.config.js
│
└─ Documentación/
   ├─ QUICK_START.md
   ├─ DOCKER_GUIDE.md
   ├─ MYSQL_WORKBENCH_SETUP.md
   ├─ TROUBLESHOOTING.md
   └─ ...
```

---

## 🚀 DEPLOY A SERVIDOR (Futuro)

```bash
# 1. Compilar imagen
docker-compose build

# 2. Push a Docker Hub (si usas)
docker push [tu-repo]/auth-service:v1

# 3. En servidor: ejecutar
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 EMERGENCIA

```bash
# ¿Todo está roto?
docker-compose down -v
rm -rf volumes/*          # ⚠️ Borra BD local
docker-compose up -d

# ¿MySQL no inicia?
docker-compose logs mysql

# ¿APIs no responden?
docker-compose logs auth-service

# ¿Quieres ver qué pasa adentro?
docker-compose exec [servicio] bash
```

---

## ✅ BEFORE PUSHING TO MAIN

```bash
# 1. ¿Tests pasan?
pytest

# 2. ¿Código está limpio?
git diff        # Revisa cambios

# 3. ¿BD fue versionada?
ls alembic/versions/ | tail -1   # Ver última migración

# 4. ¿No subistes credenciales?
grep -r "sofiasoft123" .         # ⚠️ No debe aparecer en código

# 5. ¿Commit message es claro?
git commit -m "Feat: agregar endpoint de clientes"

# 6. ¿Push a tu rama?
git push origin sofia/[feature]
```

---

**Imprime esto, ponlo en tu escritorio, y úsalo 100 veces al día.** 📋✨

Última actualización: 21 Abril 2026
