/**
 * Error de aplicación con código HTTP y lista opcional de errores de validación.
 * El middleware `errorHandler` lo traduce a una respuesta JSON uniforme.
 */
export class AppError extends Error {
  constructor(status, message, errors = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.errors = errors;
  }
}
