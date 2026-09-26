import pool from '../config/db.js';

// Columnas públicas: NUNCA se incluye `eliminado` (requisito del examen:
// "Nunca exponer al cliente en las respuestas").
const PUBLIC_COLS = `
  id, titulo, descripcion, tipo, severidad, estado,
  sistema_afectado, auditor_id, fecha_deteccion, observaciones,
  created_at, updated_at
`;

/** Inserta un incidente y devuelve el registro recién creado. */
export async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO incidentes
      (titulo, descripcion, tipo, severidad, estado, sistema_afectado, auditor_id, fecha_deteccion, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.titulo,
      data.descripcion,
      data.tipo,
      data.severidad,
      data.estado,
      data.sistema_afectado,
      data.auditor_id,
      data.fecha_deteccion,
      data.observaciones ?? null,
    ]
  );
  return findById(result.insertId);
}

/** Obtiene un incidente activo (no eliminado) por id, o null. */
export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLS} FROM incidentes WHERE id = ? AND eliminado = FALSE`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Lista incidentes activos con filtros y paginación.
 * Los eliminados (eliminado = TRUE) quedan excluidos de todo listado.
 * `page` y `limit` son enteros validados, por eso se interpolan de forma segura.
 */
export async function list({ estado, severidad, page, limit }) {
  const where = ['eliminado = FALSE'];
  const params = [];

  if (estado) {
    where.push('estado = ?');
    params.push(estado);
  }
  if (severidad) {
    where.push('severidad = ?');
    params.push(severidad);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLS} FROM incidentes ${whereSql}
     ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM incidentes ${whereSql}`,
    params
  );

  return { rows, total };
}

/** Actualiza estado (y observaciones si se envían). Devuelve el registro o null. */
export async function updateEstado(id, { estado, observaciones }) {
  const sets = ['estado = ?'];
  const params = [estado];

  if (observaciones !== undefined) {
    sets.push('observaciones = ?');
    params.push(observaciones);
  }
  params.push(id);

  const [result] = await pool.query(
    `UPDATE incidentes SET ${sets.join(', ')} WHERE id = ? AND eliminado = FALSE`,
    params
  );
  if (result.affectedRows === 0) return null;
  return findById(id);
}

/** Borrado lógico: marca eliminado = TRUE. Devuelve true si afectó una fila. */
export async function softDelete(id) {
  const [result] = await pool.query(
    'UPDATE incidentes SET eliminado = TRUE WHERE id = ? AND eliminado = FALSE',
    [id]
  );
  return result.affectedRows > 0;
}
