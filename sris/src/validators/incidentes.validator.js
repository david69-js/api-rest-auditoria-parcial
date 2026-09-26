import { AppError } from '../utils/AppError.js';
import { cleanString, toMysqlDateTime } from '../utils/sanitize.js';

export const TIPOS = [
  'acceso_no_autorizado',
  'fuga_datos',
  'malware',
  'vulnerabilidad',
  'phishing',
  'otro',
];
export const SEVERIDADES = ['critica', 'alta', 'media', 'baja'];
export const ESTADOS = ['abierto', 'en_investigacion', 'resuelto', 'cerrado'];

/** Valida y sanea el cuerpo de POST /incidentes. Lanza AppError(400) si falla. */
export function validateCreate(body = {}) {
  const errors = [];
  const data = {};

  // titulo (obligatorio, máx 150)
  if (typeof body.titulo !== 'string' || !body.titulo.trim()) {
    errors.push({ field: 'titulo', message: 'El título es obligatorio' });
  } else if (body.titulo.trim().length > 150) {
    errors.push({ field: 'titulo', message: 'El título no puede superar los 150 caracteres' });
  } else {
    data.titulo = cleanString(body.titulo);
  }

  // descripcion (obligatoria)
  if (typeof body.descripcion !== 'string' || !body.descripcion.trim()) {
    errors.push({ field: 'descripcion', message: 'La descripción es obligatoria' });
  } else {
    data.descripcion = cleanString(body.descripcion);
  }

  // tipo (enum)
  if (!TIPOS.includes(body.tipo)) {
    errors.push({ field: 'tipo', message: `tipo inválido. Valores: ${TIPOS.join(', ')}` });
  } else {
    data.tipo = body.tipo;
  }

  // severidad (enum)
  if (!SEVERIDADES.includes(body.severidad)) {
    errors.push({
      field: 'severidad',
      message: `severidad inválida. Valores: ${SEVERIDADES.join(', ')}`,
    });
  } else {
    data.severidad = body.severidad;
  }

  // estado (opcional, por defecto 'abierto')
  if (body.estado === undefined || body.estado === null || body.estado === '') {
    data.estado = 'abierto';
  } else if (!ESTADOS.includes(body.estado)) {
    errors.push({ field: 'estado', message: `estado inválido. Valores: ${ESTADOS.join(', ')}` });
  } else {
    data.estado = body.estado;
  }

  // sistema_afectado (obligatorio, máx 180)
  if (typeof body.sistema_afectado !== 'string' || !body.sistema_afectado.trim()) {
    errors.push({ field: 'sistema_afectado', message: 'El sistema afectado es obligatorio' });
  } else if (body.sistema_afectado.trim().length > 180) {
    errors.push({
      field: 'sistema_afectado',
      message: 'sistema_afectado no puede superar los 180 caracteres',
    });
  } else {
    data.sistema_afectado = cleanString(body.sistema_afectado);
  }

  // fecha_deteccion (opcional, ISO 8601; por defecto ahora)
  if (body.fecha_deteccion === undefined || body.fecha_deteccion === null || body.fecha_deteccion === '') {
    data.fecha_deteccion = toMysqlDateTime(new Date());
  } else {
    const d = new Date(body.fecha_deteccion);
    if (Number.isNaN(d.getTime())) {
      errors.push({
        field: 'fecha_deteccion',
        message: 'fecha_deteccion debe ser una fecha ISO 8601 válida',
      });
    } else {
      data.fecha_deteccion = toMysqlDateTime(d);
    }
  }

  // observaciones (opcional)
  if (body.observaciones === undefined || body.observaciones === null || body.observaciones === '') {
    data.observaciones = null;
  } else if (typeof body.observaciones !== 'string') {
    errors.push({ field: 'observaciones', message: 'observaciones debe ser texto' });
  } else {
    data.observaciones = cleanString(body.observaciones);
  }

  // Nota: auditor_id se toma del JWT (no del cliente); eliminado nunca se acepta.

  if (errors.length) throw new AppError(400, 'Datos de entrada inválidos', errors);
  return data;
}

/** Valida el cuerpo de PATCH /incidentes/:id/estado. */
export function validateUpdateEstado(body = {}) {
  const errors = [];
  const data = {};

  if (!ESTADOS.includes(body.estado)) {
    errors.push({ field: 'estado', message: `estado inválido. Valores: ${ESTADOS.join(', ')}` });
  } else {
    data.estado = body.estado;
  }

  if (body.observaciones !== undefined && body.observaciones !== null) {
    if (typeof body.observaciones !== 'string') {
      errors.push({ field: 'observaciones', message: 'observaciones debe ser texto' });
    } else {
      data.observaciones = cleanString(body.observaciones);
    }
  }

  if (errors.length) throw new AppError(400, 'Datos de entrada inválidos', errors);
  return data;
}

/** Normaliza page/limit de la query (defaults: page=1, limit=10, máx=100). */
export function parsePagination(query = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;
  return { page, limit };
}

/** Valida los filtros ?estado= y ?severidad= de la query. */
export function parseFilters(query = {}) {
  const errors = [];
  const filters = {};

  if (query.estado !== undefined && query.estado !== '') {
    if (!ESTADOS.includes(query.estado)) {
      errors.push({ field: 'estado', message: `estado inválido. Valores: ${ESTADOS.join(', ')}` });
    } else {
      filters.estado = query.estado;
    }
  }
  if (query.severidad !== undefined && query.severidad !== '') {
    if (!SEVERIDADES.includes(query.severidad)) {
      errors.push({
        field: 'severidad',
        message: `severidad inválida. Valores: ${SEVERIDADES.join(', ')}`,
      });
    } else {
      filters.severidad = query.severidad;
    }
  }

  if (errors.length) throw new AppError(400, 'Filtros inválidos', errors);
  return filters;
}
