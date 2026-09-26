import * as Incidente from '../models/incidente.model.js';
import {
  validateCreate,
  validateUpdateEstado,
  parsePagination,
  parseFilters,
} from '../validators/incidentes.validator.js';
import { AppError } from '../utils/AppError.js';
import { ok, created, paginated } from '../utils/response.js';

/**
 * POST /api/v1/incidentes  (auditor | administrador)
 * Registra un nuevo incidente. El auditor_id se toma del token, no del cliente.
 */
export async function crearIncidente(req, res, next) {
  try {
    const data = validateCreate(req.body);
    data.auditor_id = req.user.id;

    const incidente = await Incidente.create(data);
    return created(res, { data: incidente, message: 'Incidente registrado correctamente' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/incidentes  (auditor | administrador)
 * Lista incidentes activos con filtros (?estado= ?severidad=) y paginación.
 */
export async function listarIncidentes(req, res, next) {
  try {
    const { page, limit } = parsePagination(req.query);
    const filters = parseFilters(req.query);

    const { rows, total } = await Incidente.list({ ...filters, page, limit });
    return paginated(res, {
      items: rows,
      page,
      limit,
      total,
      message: 'Listado de incidentes activos',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/incidentes/:id  (auditor | administrador)
 * Devuelve el detalle de un incidente activo.
 */
export async function obtenerIncidente(req, res, next) {
  try {
    const incidente = await Incidente.findById(req.params.id);
    if (!incidente) throw new AppError(404, 'Incidente no encontrado');
    return ok(res, { data: incidente, message: 'Detalle del incidente' });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/incidentes/:id/estado  (solo administrador)
 * Actualiza el estado y, opcionalmente, las observaciones.
 */
export async function actualizarEstado(req, res, next) {
  try {
    const data = validateUpdateEstado(req.body);
    const incidente = await Incidente.updateEstado(req.params.id, data);
    if (!incidente) throw new AppError(404, 'Incidente no encontrado');
    return ok(res, { data: incidente, message: 'Estado del incidente actualizado' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/incidentes/:id  (solo administrador)
 * Borrado lógico: marca eliminado = true.
 */
export async function eliminarIncidente(req, res, next) {
  try {
    const deleted = await Incidente.softDelete(req.params.id);
    if (!deleted) throw new AppError(404, 'Incidente no encontrado');
    return ok(res, { data: null, message: 'Incidente eliminado (borrado lógico)' });
  } catch (err) {
    next(err);
  }
}
