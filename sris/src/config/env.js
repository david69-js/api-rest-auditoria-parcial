// Configuración central leída desde variables de entorno.
// server.js carga `dotenv/config` antes de importar este módulo.

export const PORT = process.env.PORT || 4000;
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Clave de firma del JWT. NUNCA usar el valor por defecto en producción.
export const JWT_SECRET =
  process.env.JWT_SECRET || 'cambia-esta-clave-super-secreta-en-produccion';

// Expiración del token: requisito del examen = 2 horas.
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

// Coste de hashing bcrypt.
export const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

// Sembrar datos de ejemplo (usuarios + auditoría de api-rest) al arrancar.
export const SEED_ON_START = process.env.SEED_ON_START !== 'false';
