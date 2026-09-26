import pool from '../config/db.js';

/** Busca un usuario por email (incluye el hash para validar contraseña). */
export async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = ?',
    [email]
  );
  return rows[0] ?? null;
}

/** Busca un usuario por id (sin exponer el hash). */
export async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, nombre, email, rol, created_at, updated_at FROM usuarios WHERE id = ?',
    [id]
  );
  return rows[0] ?? null;
}

/** Crea un usuario y devuelve su id. */
export async function create({ nombre, email, password_hash, rol }) {
  const [result] = await pool.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    [nombre, email, password_hash, rol]
  );
  return result.insertId;
}

/** Número total de usuarios (para decidir si sembrar). */
export async function count() {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM usuarios');
  return total;
}
