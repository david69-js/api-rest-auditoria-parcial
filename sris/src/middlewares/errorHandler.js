import { AppError } from '../utils/AppError.js';

/** Middleware para rutas no encontradas (404). */
export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    data: null,
    errors: null,
  });
}

/** Middleware central de manejo de errores — devuelve siempre JSON uniforme. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      data: null,
      errors: err.errors ?? null,
    });
  }

  // Body JSON malformado (lanzado por express.json()).
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'El cuerpo de la petición no es JSON válido',
      data: null,
      errors: null,
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    data: null,
    errors: null,
  });
}
