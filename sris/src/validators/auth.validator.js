import { AppError } from '../utils/AppError.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida el cuerpo de POST /auth/login. */
export function validateLogin(body = {}) {
  const errors = [];

  if (typeof body.email !== 'string' || !EMAIL_RE.test(body.email.trim())) {
    errors.push({ field: 'email', message: 'El email es obligatorio y debe ser válido' });
  }
  if (typeof body.password !== 'string' || body.password.length < 1) {
    errors.push({ field: 'password', message: 'La contraseña es obligatoria' });
  }

  if (errors.length) throw new AppError(400, 'Credenciales incompletas', errors);

  return { email: body.email.trim().toLowerCase(), password: body.password };
}
