// Helpers para responder SIEMPRE con la estructura JSON uniforme:
//   { success, data, message, errors }

/** Respuesta de éxito genérica (200 por defecto). */
export function ok(res, { data = null, message = null, status = 200 } = {}) {
  return res.status(status).json({ success: true, message, data, errors: null });
}

/** Respuesta de recurso creado (201). */
export function created(res, opts = {}) {
  return ok(res, { ...opts, status: 201 });
}

/**
 * Respuesta paginada para GET /incidentes.
 * Cumple ambas estructuras exigidas por el examen a la vez:
 *   uniforme  -> { success, data, message, errors }
 *   paginación-> { data, page, limit, total }
 */
export function paginated(res, { items, page, limit, total, message = null }) {
  return res.status(200).json({
    success: true,
    message,
    errors: null,
    data: items,
    page,
    limit,
    total,
  });
}

/** Respuesta de error genérica. */
export function fail(res, { status = 400, message = 'Error', errors = null } = {}) {
  return res.status(status).json({ success: false, message, data: null, errors });
}
