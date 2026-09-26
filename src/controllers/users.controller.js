import pool from '../config/db.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** GET /api/users — lista todos los usuarios */
export async function listUsers(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at, updated_at FROM users ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

/** GET /api/users/:id — obtiene un usuario por id */
export async function getUser(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/** POST /api/users — crea un usuario */
export async function createUser(req, res, next) {
  try {
    const { name, email } = req.body ?? {};

    if (!name || !email) {
      return res.status(400).json({ error: 'Los campos "name" y "email" son obligatorios' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido' });
    }

    const [result] = await pool.query('INSERT INTO users (name, email) VALUES (?, ?)', [
      name,
      email,
    ]);
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }
    next(err);
  }
}

/** PUT /api/users/:id — actualiza un usuario */
export async function updateUser(req, res, next) {
  try {
    const { name, email } = req.body ?? {};

    if (!name || !email) {
      return res.status(400).json({ error: 'Los campos "name" y "email" son obligatorios' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'El email no tiene un formato válido' });
    }

    const [result] = await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [
      name,
      email,
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }
    next(err);
  }
}

/** DELETE /api/users/:id — elimina un usuario */
export async function deleteUser(req, res, next) {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
