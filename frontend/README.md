# Frontend

Interfaz web sencilla (HTML + CSS + JavaScript, sin frameworks) que consume la
API REST de usuarios del proyecto principal.

## Qué incluye

- Listado de usuarios en tabla.
- Crear, editar y eliminar usuarios (CRUD completo vía `fetch`).
- Indicador de estado de la API (usa el endpoint `/health`).
- Campo para configurar la **URL de la API** (se guarda en `localStorage`), útil
  para apuntar a `localhost` en desarrollo o al dominio de Railway en producción.

## Cómo abrirlo

La API debe estar corriendo (ver el README del proyecto raíz). La API ya tiene
**CORS habilitado**, así que el frontend puede llamarla desde otro origen.

### Opción 1 — Servidor estático rápido

```bash
cd frontend
npx serve .        # o: python3 -m http.server 5500
```

Abre la URL que indique (p. ej. `http://localhost:3000` para la API y el
servidor estático en otro puerto).

### Opción 2 — Abrir el archivo directamente

Abre `frontend/index.html` en el navegador. Si la API no está en
`http://localhost:3000`, cámbiala en el campo **URL de la API** y pulsa
**Guardar**.

## Apuntar a producción (Railway)

1. Despliega la API en Railway y genera un dominio público.
2. Abre el frontend, pega la URL pública en **URL de la API** y guarda.
