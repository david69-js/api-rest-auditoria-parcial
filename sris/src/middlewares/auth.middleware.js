import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Verifica el token JWT del header `Authorization: Bearer <token>`.
 * Rellena `req.user = { id, email, rol }`.
 */
export function verifyJwt(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Token no proporcionado. Usa: Authorization: Bearer <token>'));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: Number(payload.sub), email: payload.email, rol: payload.rol };
    return next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'El token ha expirado' : 'Token inválido';
    return next(new AppError(401, message));
  }
}

/**
 * Control de acceso por roles (RBAC).
 * Uso: requireRole('administrador') | requireRole('auditor', 'administrador')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'No autenticado'));
    }
    if (!roles.includes(req.user.rol)) {
      return next(new AppError(403, 'No tienes permisos para realizar esta acción'));
    }
    return next();
  };
}
