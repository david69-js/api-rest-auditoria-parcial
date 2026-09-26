# SRIS — Sistema de Registro de Incidentes de Seguridad

API REST para que auditores de seguridad **registren, consulten y actualicen**
incidentes detectados en campo. Incluye **autenticación JWT**, **control de acceso
por roles (RBAC)**, **contraseñas hasheadas con bcrypt**, **borrado lógico**,
**paginación** y una **estructura JSON uniforme**.

> Este servicio vive dentro del proyecto `api-rest` (carpeta `sris/`) y, como caso
> real, **audita al propio `api-rest`**: al arrancar siembra su base de datos con
> los hallazgos de seguridad detectados en ese sistema hermano. Ver
> [`AUDITORIA.md`](./AUDITORIA.md).

Mismo stack que `api-rest`: **Node.js + Express + MySQL** (ES Modules).

---

## Índice

1. [Stack](#stack)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Puesta en marcha](#puesta-en-marcha)
4. [Usuarios de prueba](#usuarios-de-prueba)
5. [Modelo de datos](#modelo-de-datos-incidente)
6. [Endpoints](#endpoints)
7. [Formato de respuesta](#formato-de-respuesta)
8. [Seguridad](#seguridad)
9. [Pruebas rápidas](#pruebas-rápidas)
10. [Cómo cumple la rúbrica](#cómo-cumple-la-rúbrica)

---

## Stack

| Capa        | Tecnología                                  |
| ----------- | ------------------------------------------- |
| Runtime     | Node.js 20+ (ES Modules)                    |
| Framework   | Express 4                                   |
| Base datos  | MySQL 8 (`mysql2` con pool)                 |
| Auth        | JWT (`jsonwebtoken`), expira en 2 h         |
| Hashing     | `bcryptjs`                                  |
| Seguridad   | Helmet, CORS, validación + saneo de entrada |
| Contenedor  | Docker / docker-compose                     |

---

## Estructura del proyecto

Código organizado por responsabilidad:

```
sris/
├── src/
│   ├── config/
│   │   ├── db.js              # Pool MySQL + creación de la DB
│   │   └── env.js             # Configuración (JWT, puerto, bcrypt)
│   ├── db/
│   │   ├── init.js            # Migraciones (crea tablas)
│   │   └── seed.js            # Usuarios + auditoría de api-rest
│   ├── models/
│   │   ├── usuario.model.js   # Acceso a datos: usuarios
│   │   └── incidente.model.js # Acceso a datos: incidentes
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── incidentes.controller.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   └── incidentes.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js # verifyJwt + requireRole (RBAC)
│   │   └── errorHandler.js    # 404 + manejo central de errores
│   ├── validators/            # Validación y saneo por recurso
│   ├── utils/                 # Respuestas uniformes, AppError, sanitize
│   ├── app.js                 # Configura Express
│   └── server.js              # Arranca el servidor
├── scripts/smoke.sh           # Prueba de humo end-to-end (curl)
├── requests.http              # Colección para VS Code REST Client
├── docker-compose.yml         # API + MySQL (DB en el puerto 3307)
├── Dockerfile
├── .env.example
├── README.txt                 # Comando de inicio (entrega)
├── AUDITORIA.md               # Hallazgos de seguridad en api-rest
└── README.md                  # Este archivo
```

---

## Puesta en marcha

### Opción A — Docker (recomendada)

Levanta la API **y** su propia base de datos MySQL con un comando:

```bash
docker compose up --build
```

La API queda en `http://localhost:4000`. El MySQL de este proyecto se publica en
el puerto **3307** del host para no chocar con el `api-rest` (que usa el 3306).

### Opción B — Node directo

Necesitas un MySQL accesible. Ajusta credenciales en `.env`:

```bash
cp .env.example .env
npm install
npm start          # o: npm run dev  (recarga con --watch)
```

> La base de datos, las tablas y los datos de ejemplo se crean **automáticamente**
> al arrancar. No hay pasos manuales de migración.

---

## Usuarios de prueba

Creados por el seed en el primer arranque (contraseñas hasheadas con bcrypt):

| Rol           | Email                | Contraseña   |
| ------------- | -------------------- | ------------ |
| administrador | `admin@sris.local`   | `Admin123!`  |
| auditor       | `auditor@sris.local` | `Auditor123!`|

---

## Modelo de datos (Incidente)

| Campo              | Tipo      | Req. | Notas                                                         |
| ------------------ | --------- | ---- | ------------------------------------------------------------ |
| `id`               | int       | auto | Autogenerado por el servidor.                                |
| `titulo`           | string    | sí   | Máx. 150 caracteres.                                          |
| `descripcion`      | string    | sí   | Detalle completo.                                            |
| `tipo`             | enum      | sí   | `acceso_no_autorizado`·`fuga_datos`·`malware`·`vulnerabilidad`·`phishing`·`otro` |
| `severidad`        | enum      | sí   | `critica`·`alta`·`media`·`baja`                              |
| `estado`           | enum      | no   | `abierto`·`en_investigacion`·`resuelto`·`cerrado` (def. `abierto`) |
| `sistema_afectado` | string    | sí   | Máx. 180 caracteres.                                          |
| `auditor_id`       | int       | auto | **Se toma del JWT**, no del cliente.                         |
| `fecha_deteccion`  | datetime  | no   | ISO 8601 UTC (def. ahora).                                    |
| `observaciones`    | string    | no   | Notas de seguimiento.                                        |
| `eliminado`        | boolean   | auto | Borrado lógico. **Nunca se expone** en las respuestas.       |
| `created_at`       | datetime  | auto | Asignado por el servidor.                                    |
| `updated_at`       | datetime  | auto | Actualizado automáticamente.                                 |

---

## Endpoints

Prefijo base: **`/api/v1`**

| Método | Ruta                        | Auth        | Rol permitido            | OK  |
| ------ | --------------------------- | ----------- | ------------------------ | --- |
| POST   | `/auth/login`               | Libre       | —                        | 200 |
| POST   | `/incidentes`               | JWT         | auditor, administrador   | 201 |
| GET    | `/incidentes`               | JWT         | auditor, administrador   | 200 |
| GET    | `/incidentes/:id`           | JWT         | auditor, administrador   | 200 |
| PATCH  | `/incidentes/:id/estado`    | JWT         | **administrador**        | 200 |
| DELETE | `/incidentes/:id`           | JWT + Admin | **administrador**        | 200 |

**Filtros y paginación** en `GET /incidentes`:
`?estado=` · `?severidad=` · `?page=` (def. 1) · `?limit=` (def. 10, máx. 100).

### Ejemplos

**Login**

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sris.local","password":"Admin123!"}'
```

**Crear incidente** (token de auditor o admin)

```bash
curl -X POST http://localhost:4000/api/v1/incidentes \
  -H "Authorization: Bearer <TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{
    "titulo":"Puerto SSH expuesto",
    "descripcion":"Puerto 22 abierto sin restricción de IP",
    "tipo":"vulnerabilidad",
    "severidad":"alta",
    "sistema_afectado":"infra-staging"
  }'
```

**Listar con filtros**

```bash
curl "http://localhost:4000/api/v1/incidentes?severidad=critica&page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Formato de respuesta

Todas las respuestas usan la estructura uniforme:

```json
{ "success": true, "message": "…", "data": {}, "errors": null }
```

`GET /incidentes` añade además los campos de paginación al mismo nivel:

```json
{
  "success": true,
  "message": "Listado de incidentes activos",
  "errors": null,
  "data": [ /* incidentes */ ],
  "page": 1,
  "limit": 10,
  "total": 6
}
```

**Códigos HTTP:** `200` OK · `201` Created · `400` Bad Request · `401`
Unauthorized · `403` Forbidden · `404` Not Found · `500` Server Error.

---

## Seguridad

- **JWT obligatorio** en todos los endpoints excepto `/auth/login`
  (`Authorization: Bearer <token>`). El token **expira en 2 h** e incluye el
  campo `rol`.
- **RBAC**: el auditor puede crear y consultar; el administrador puede además
  actualizar estado y eliminar.
- **Contraseñas** hasheadas con **bcrypt** (nunca en texto plano ni MD5).
- **Validación + saneo** de todas las entradas: enums controlados, límites de
  longitud, escape de HTML (anti-XSS) y **consultas parametrizadas** (anti-SQL
  injection).
- `auditor_id` se deriva del token, no del cuerpo de la petición.
- El campo `eliminado` **nunca** se devuelve al cliente y los incidentes con
  `eliminado = true` no aparecen en los listados.

---

## Pruebas rápidas

Con la API corriendo (necesita `curl` y `jq`):

```bash
npm run smoke
# o:  BASE=http://localhost:4000 bash scripts/smoke.sh
```

El script prueba: login de ambos roles, 401 sin token, creación (201),
paginación, 403 por RBAC, PATCH y DELETE por admin, ocultamiento del eliminado
y validación 400.

---

## Cómo cumple la rúbrica

| Criterio (5.00)                                                     | Dónde |
| ------------------------------------------------------------------ | ----- |
| 5 endpoints funcionales (R1–R5)                                    | `routes/`, `controllers/` |
| Autenticación JWT + RBAC                                           | `middlewares/auth.middleware.js` |
| Validación de entrada, manejo de errores y códigos HTTP           | `validators/`, `middlewares/errorHandler.js` |
| Borrado lógico (`eliminado=true`, oculto, campo no expuesto)      | `models/incidente.model.js` (`PUBLIC_COLS`, `softDelete`) |
| Paginación en `GET /incidentes` + JSON uniforme                   | `utils/response.js` (`paginated`) |
| Hashing de contraseñas + organización por responsabilidad         | `bcryptjs` en `auth`/`seed`, estructura `src/` |
