#!/usr/bin/env bash
# Prueba de humo end-to-end del SRIS. Requiere la API corriendo y `curl` + `jq`.
#   BASE=http://localhost:4000 bash scripts/smoke.sh
set -euo pipefail

BASE="${BASE:-http://localhost:4000}"
API="$BASE/api/v1"

say() { printf '\n\033[1;36m== %s ==\033[0m\n' "$1"; }

say "Health"
curl -s "$BASE/health"; echo

say "Login como AUDITOR"
AUD_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"auditor@sris.local","password":"Auditor123!"}' | jq -r '.data.token')
echo "token auditor: ${AUD_TOKEN:0:24}..."

say "Login como ADMINISTRADOR"
ADM_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sris.local","password":"Admin123!"}' | jq -r '.data.token')
echo "token admin: ${ADM_TOKEN:0:24}..."

say "GET /incidentes SIN token -> 401"
curl -s -o /dev/null -w '%{http_code}\n' "$API/incidentes"

say "Crear incidente (auditor) -> 201"
NEW_ID=$(curl -s -X POST "$API/incidentes" \
  -H "Authorization: Bearer $AUD_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"titulo":"Prueba de humo","descripcion":"Incidente de prueba","tipo":"otro","severidad":"baja","sistema_afectado":"sris"}' \
  | jq -r '.data.id')
echo "id creado: $NEW_ID"

say "Listar incidentes con paginación (auditor)"
curl -s "$API/incidentes?page=1&limit=5" -H "Authorization: Bearer $AUD_TOKEN" \
  | jq '{success, page, limit, total, count:(.data|length)}'

say "Auditor intenta PATCH estado -> 403 (RBAC)"
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$API/incidentes/$NEW_ID/estado" \
  -H "Authorization: Bearer $AUD_TOKEN" -H 'Content-Type: application/json' \
  -d '{"estado":"resuelto"}'

say "Admin PATCH estado -> 200"
curl -s -X PATCH "$API/incidentes/$NEW_ID/estado" \
  -H "Authorization: Bearer $ADM_TOKEN" -H 'Content-Type: application/json' \
  -d '{"estado":"en_investigacion","observaciones":"Revisando"}' | jq '{success, message, estado:.data.estado}'

say "Auditor intenta DELETE -> 403"
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE "$API/incidentes/$NEW_ID" \
  -H "Authorization: Bearer $AUD_TOKEN"

say "Admin DELETE (borrado lógico) -> 200"
curl -s -X DELETE "$API/incidentes/$NEW_ID" -H "Authorization: Bearer $ADM_TOKEN" \
  | jq '{success, message}'

say "El incidente eliminado ya NO aparece -> detalle 404"
curl -s -o /dev/null -w '%{http_code}\n' "$API/incidentes/$NEW_ID" \
  -H "Authorization: Bearer $AUD_TOKEN"

say "Validación: crear con tipo inválido -> 400"
curl -s -X POST "$API/incidentes" \
  -H "Authorization: Bearer $AUD_TOKEN" -H 'Content-Type: application/json' \
  -d '{"titulo":"x","descripcion":"x","tipo":"NO_EXISTE","severidad":"alta","sistema_afectado":"x"}' \
  | jq '{success, message, errors}'

printf '\n\033[1;32m✔ Smoke test completado\033[0m\n'
