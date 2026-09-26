# Auditoría de seguridad — sistema `api-rest`

Este documento resume la revisión de seguridad del proyecto hermano `api-rest`
(la API de usuarios ubicada en `../`). Los mismos hallazgos se cargan como
**incidentes** en la base de datos del SRIS al arrancar (ver `src/db/seed.js`),
de modo que el SRIS "audita" al sistema real desde el primer minuto.

Auditor: `auditor@sris.local` · Sistema evaluado: `api-rest` (Node + Express + MySQL).

---

## Resumen de hallazgos

| # | Hallazgo                                             | Tipo                  | Severidad |
| - | --------------------------------------------------- | --------------------- | --------- |
| 1 | Endpoints de usuarios sin autenticación             | acceso_no_autorizado  | crítica   |
| 2 | Exposición de datos personales (PII) sin control    | fuga_datos            | alta      |
| 3 | CORS abierto a cualquier origen                     | vulnerabilidad        | media     |
| 4 | Ausencia de rate limiting                           | vulnerabilidad        | media     |
| 5 | Borrado físico e irreversible de usuarios           | vulnerabilidad        | media     |
| 6 | Campos de usuario sin saneamiento anti-XSS          | vulnerabilidad        | baja      |

---

## Detalle

### 1. Endpoints de usuarios sin autenticación — **crítica**
Todo el recurso `/api/users` (GET, POST, PUT, DELETE) es público: no hay JWT ni
control de acceso. Cualquiera puede leer, crear, modificar y borrar usuarios.
- **Evidencia:** `src/routes/users.routes.js` no aplica ningún middleware.
- **Mitigación:** exigir JWT + RBAC (implementado en SRIS como referencia).

### 2. Exposición de PII sin control — **alta**
`GET /api/users` devuelve el email de todos los usuarios, sin auth ni paginación.
- **Evidencia:** `listUsers()` en `src/controllers/users.controller.js`.
- **Mitigación:** proteger con autenticación y paginar.

### 3. CORS abierto — **media**
`app.use(cors())` sin opciones permite cualquier origen (`Access-Control-Allow-Origin: *`).
- **Evidencia:** `src/app.js`.
- **Mitigación:** allowlist de orígenes de confianza.

### 4. Sin rate limiting — **media**
No hay limitación de tasa; expuesto a fuerza bruta y abuso.
- **Evidencia:** cadena de middlewares en `src/app.js`.
- **Mitigación:** `express-rate-limit` en endpoints sensibles.

### 5. Borrado físico irreversible — **media**
`DELETE /api/users/:id` ejecuta `DELETE FROM users`: sin borrado lógico ni traza.
- **Evidencia:** `deleteUser()` en `src/controllers/users.controller.js`.
- **Mitigación:** borrado lógico con `eliminado=true` (implementado en SRIS).

### 6. Sin saneamiento anti-XSS — **baja**
`name`/`email` se guardan sin escapar HTML; posible XSS almacenado.
- **Evidencia:** `createUser()`/`updateUser()` en `src/controllers/users.controller.js`.
- **Mitigación:** validar y escapar entradas (implementado en `utils/sanitize.js`).

---

> Nota: hallazgos obtenidos por revisión estática del código en el momento de la
> auditoría. Si `api-rest` cambia, conviene re-evaluar.
