import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import * as Usuario from '../models/usuario.model.js';
import { validateLogin } from '../validators/auth.validator.js';
import { AppError } from '../utils/AppError.js';
import { ok } from '../utils/response.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';

/**
 * POST /api/v1/auth/login  (acceso libre)
 * Autentica por email + contraseña y devuelve un JWT con el rol del usuario.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = validateLogin(req.body);

    const usuario = await Usuario.findByEmail(email);
    // Mensaje genérico para no revelar si el email existe.
    if (!usuario) throw new AppError(401, 'Credenciales inválidas');

    const passwordOk = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordOk) throw new AppError(401, 'Credenciales inválidas');

    const token = jwt.sign(
      { email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { subject: String(usuario.id), expiresIn: JWT_EXPIRES_IN }
    );

    return ok(res, {
      message: 'Autenticación exitosa',
      data: {
        token,
        tipo: 'Bearer',
        expiraEn: JWT_EXPIRES_IN,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
