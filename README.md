# api-rest

API REST con **Node.js + Express** y **MySQL**, contenerizada con **Docker** y
lista para desplegar en **Railway**. Incluye un **frontend** en HTML/CSS/JS puro
que consume la API.

---

## Índice

1. [¿Qué hace este proyecto?](#qué-hace-este-proyecto)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Cómo funciona (explicación)](#cómo-funciona-explicación)
5. [Endpoints de la API](#endpoints-de-la-api)
6. [Variables de entorno](#variables-de-entorno)
7. [Puesta en marcha en local](#puesta-en-marcha-en-local)
8. [El frontend](#el-frontend)
9. [Pruebas rápidas](#pruebas-rápidas)
10. [Despliegue en Railway](#despliegue-en-railway)
11. [Preguntas frecuentes](#preguntas-frecuentes)

---

## ¿Qué hace este proyecto?

Es una API REST de ejemplo que gestiona **usuarios** (un CRUD completo: crear,
leer, actualizar y eliminar). Está pensada como base sólida para arrancar
cualquier proyecto: ya trae seguridad básica, conexión a base de datos con pool,
migración automática de tablas, health check y contenedor Docker.

Se acompaña de un **frontend** sencillo para gestionar los usuarios desde el
navegador sin escribir una sola línea de `curl`.

---

## Stack tecnológico

| Capa       | Tecnología                                            |
| ---------- | ----------------------------------------------------- |
| Runtime    | Node.js 22 (ES Modules)                               |
| Framework  | Express 4                                             |
| Base datos | MySQL 8 (`mysql2` con pool de conexiones)             |
| Seguridad  | Helmet (headers) + CORS                               |
| Logging    | Morgan                                                |
| Contenedor | Docker / docker-compose                               |
| Frontend   | HTML + CSS + JavaScript (sin frameworks, solo `fetch`)|
| Deploy     | Railway (por Dockerfile)                              |

---

## Estructura del proyecto

```
api-rest/
├── src/                          # Backend (API)
│   ├── config/db.js              # Pool de conexiones a MySQL
│   ├── db/init.js                # Crea las tablas al arrancar
│   ├── controllers/
│   │   └── users.controller.js   # Lógica de cada endpoint de usuarios
│   ├── routes/
│   │   ├── index.js              # Enrutador raíz
│   │   └── users.routes.js       # Rutas /api/users
│   ├── middlewares/
│   │   └── errorHandler.js       # 404 y manejo central de errores
│   ├── app.js                    # Configura Express (middlewares, rutas)
│   └── server.js                 # Arranca el servidor
├── frontend/                     # Frontend web
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── README.md
├── Dockerfile                    # Imagen de producción de la API
├── docker-compose.yml            # API + MySQL para desarrollo local
├── railway.json                  # Configuración de despliegue en Railway
├── .env.example                  # Plantilla de variables de entorno
├── .dockerignore / .gitignore
└── README.md                     # Este archivo
```

---

## Cómo funciona (explicación)

El flujo de una petición, de fuera hacia dentro:

1. **`server.js`** arranca la app. Antes de escuchar peticiones:
   - Comprueba que MySQL responde (`assertDbConnection`).
   - Ejecuta `runMigrations()`, que crea la tabla `users` si no existe. Por eso
     **no hay pasos de migración manuales**: al desplegar, la base de datos queda
     lista sola.
   - Escucha en el puerto que indique `PORT` (Railway lo inyecta
     automáticamente).
   - Gestiona un apagado limpio ante `SIGTERM`/`SIGINT`.

2. **`app.js`** define la cadena de middlewares de Express:
   - `helmet()` → cabeceras de seguridad.
   - `cors()` → permite que el frontend (otro origen) llame a la API.
   - `express.json()` → parsea el body JSON.
   - `morgan()` → registra cada petición en consola.
   - `GET /health` → comprueba la conexión a la DB y responde el estado (lo usa
     Railway para saber si el servicio está sano).

3. **`routes/`** dirige cada URL a su controlador.

4. **`controllers/users.controller.js`** contiene la lógica: valida la entrada,
   ejecuta consultas SQL parametrizadas (evitando inyección SQL) contra el pool
   y devuelve la respuesta. Traduce errores de MySQL a códigos HTTP claros
   (p. ej. email duplicado → `409`).

5. **`config/db.js`** crea un **pool** de conexiones reutilizables. Detecta
   automáticamente si debe usar una URL completa (`MYSQL_URL`, la que da Railway)
   o variables sueltas (`DB_HOST`, `DB_USER`, …, para local).

6. **`middlewares/errorHandler.js`** captura las rutas inexistentes (`404`) y
   cualquier error no controlado, devolviendo siempre JSON.

---

## Endpoints de la API

Base URL en local: `http://localhost:3000`

| Método | Ruta             | Descripción              | Respuesta OK |
| ------ | ---------------- | ------------------------ | ------------ |
| GET    | `/`              | Info de la API           | `200`        |
| GET    | `/health`        | Estado del servicio + DB | `200` / `503`|
| GET    | `/api/users`     | Lista todos los usuarios | `200`        |
| GET    | `/api/users/:id` | Obtiene un usuario       | `200` / `404`|
| POST   | `/api/users`     | Crea un usuario          | `201`        |
| PUT    | `/api/users/:id` | Actualiza un usuario     | `200` / `404`|
| DELETE | `/api/users/:id` | Elimina un usuario       | `204` / `404`|

**Cuerpo (JSON) para crear/actualizar:**

```json
{ "name": "Ada Lovelace", "email": "ada@example.com" }
```

**Códigos de error:**

| Código | Cuándo ocurre                             |
| ------ | ----------------------------------------- |
| `400`  | Faltan campos o el email no es válido      |
| `404`  | El usuario o la ruta no existen            |
| `409`  | Ya existe un usuario con ese email         |
| `500`  | Error interno del servidor                 |
| `503`  | La base de datos no responde (`/health`)   |

---

## Variables de entorno

Copia la plantilla y ajústala:

```bash
cp .env.example .env
```

| Variable        | Descripción                                | Por defecto |
| --------------- | ------------------------------------------ | ----------- |
| `PORT`          | Puerto de la API (Railway lo asigna)       | `3000`      |
| `NODE_ENV`      | `development` o `production`                | —           |
| `DB_HOST`       | Host de MySQL                              | `localhost` |
| `DB_PORT`       | Puerto de MySQL                            | `3306`      |
| `DB_USER`       | Usuario de MySQL                           | `root`      |
| `DB_PASSWORD`   | Contraseña de MySQL                        | —           |
| `DB_NAME`       | Nombre de la base de datos                 | `app`       |
| `DB_POOL_LIMIT` | Máx. conexiones simultáneas del pool       | `10`        |
| `MYSQL_URL`     | URL completa (alternativa; la usa Railway) | —           |

> Si defines `MYSQL_URL` (o `DATABASE_URL`), tiene prioridad sobre las variables
> sueltas. En Railway usarás la referencia `MYSQL_URL=${{ MySQL.MYSQL_URL }}`.

---

## Puesta en marcha en local

### Opción 1 — Docker (recomendada, levanta API + MySQL juntos)

```bash
docker compose up --build
```

La API queda en `http://localhost:3000`. MySQL corre en un contenedor con sus
datos persistidos en un volumen.

> **Nota:** el `docker-compose.yml` publica el puerto `3306` en tu máquina. Si ya
> tienes un MySQL local usando ese puerto, cambia esa línea a `'3307:3306'` para
> evitar el conflicto (no afecta a la comunicación interna API↔DB).

### Opción 2 — Node directo (necesitas un MySQL corriendo)

```bash
cp .env.example .env     # ajusta credenciales
npm install
npm run dev              # recarga en caliente con --watch
```

---

## El frontend

Interfaz web (en la carpeta `frontend/`) para gestionar usuarios desde el
navegador. Incluye listado, alta, edición y borrado, un indicador del estado de
la API y un campo para configurar la URL de la API.

Con la API corriendo:

```bash
cd frontend
python3 -m http.server 5500     # o: npx serve .
```

Abre `http://localhost:5500`. Si la API no está en `http://localhost:3000`,
cámbiala en el campo **"URL de la API"** y pulsa **Guardar** (se recuerda en el
navegador). Más detalles en [`frontend/README.md`](frontend/README.md).

---

## Pruebas rápidas

Con la API corriendo:

```bash
# Estado
curl http://localhost:3000/health

# Crear
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com"}'

# Listar
curl http://localhost:3000/api/users

# Actualizar (id 1)
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada L.","email":"ada@example.com"}'

# Eliminar (id 1)
curl -X DELETE http://localhost:3000/api/users/1
```

---

## Despliegue en Railway

1. Sube este repositorio a GitHub.
2. En [Railway](https://railway.app): **New Project → Deploy from GitHub repo**.
   Railway detecta el `Dockerfile` y el `railway.json` automáticamente.
3. En el proyecto: **New → Database → Add MySQL**.
4. En el servicio de la API, pestaña **Variables**, añade la referencia a la DB:

   ```
   MYSQL_URL=${{ MySQL.MYSQL_URL }}
   ```

5. Railway construye la imagen y despliega. El `PORT` lo inyecta él solo y el
   health check apunta a `/health`.
6. En **Settings → Networking → Generate Domain** obtienes la URL pública.
7. (Opcional) Para usar el frontend contra producción, ábrelo y pega esa URL
   pública en el campo **"URL de la API"**.

Las tablas se crean automáticamente al arrancar, así que no hay pasos manuales.

---

## Preguntas frecuentes

**¿Dónde añado más recursos (además de usuarios)?**
Crea un nuevo controlador en `src/controllers/`, sus rutas en `src/routes/` y
regístralas en `src/routes/index.js`. Añade la tabla en `src/db/init.js`.

**¿Por qué no uso un ORM?**
Para mantenerlo ligero y transparente. `mysql2` con consultas parametrizadas es
suficiente y seguro. Puedes añadir Prisma/Sequelize si el proyecto crece.

**¿El frontend se despliega también en Railway?**
Este repo despliega solo la API. El frontend son archivos estáticos: puedes
servirlos con cualquier hosting estático (Netlify, Vercel, GitHub Pages) y
apuntarlos a la URL de la API. También podrías servirlos desde la propia API con
`express.static`.

**¿Cómo veo los logs en producción?**
En el panel de Railway, en la pestaña de **Deployments → Logs** del servicio.
```
