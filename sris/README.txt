SRIS — Sistema de Registro de Incidentes de Seguridad
=====================================================

COMANDO DE INICIO
-----------------

Opción A) Docker (recomendada, levanta API + MySQL):
    docker compose up --build
  API en: http://localhost:4000

Opción B) Node directo (necesita un MySQL accesible):
    cp .env.example .env      # ajusta credenciales de la DB
    npm install
    npm start
  API en: http://localhost:4000  (o el PORT que definas)

La base de datos, las tablas y los datos de ejemplo se crean solos al arrancar.

USUARIOS DE PRUEBA (creados por el seed)
----------------------------------------
  admin@sris.local   / Admin123!     (rol: administrador)
  auditor@sris.local / Auditor123!   (rol: auditor)

PRIMER PASO
-----------
1) POST http://localhost:4000/api/v1/auth/login  con email+password  -> devuelve token JWT
2) Enviar el token en el header:  Authorization: Bearer <token>

Ver README.md para la documentación completa de endpoints.
