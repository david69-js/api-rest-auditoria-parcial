import mysql from 'mysql2/promise';

/**
 * Construye la configuración de conexión a MySQL.
 *
 * Soporta dos modos:
 *  1. URL de conexión completa (MYSQL_URL / DATABASE_URL).
 *  2. Variables sueltas (DB_HOST, DB_PORT, ...) para docker-compose / local.
 *
 * `timezone: 'Z'` hace que las columnas DATETIME se interpreten en UTC, de modo
 * que las fechas se serializan a JSON en ISO 8601 UTC (requisito del examen).
 */
function baseOptions() {
  return {
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    timezone: 'Z',
  };
}

function connectionTarget() {
  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (connectionUrl) {
    return { uri: connectionUrl };
  }
  return {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database:
      process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'sris',
  };
}

const pool = mysql.createPool({ ...connectionTarget(), ...baseOptions() });

/**
 * Crea la base de datos si no existe (solo en modo "variables sueltas").
 * Útil para arrancar en local sin haber creado la DB manualmente.
 */
export async function ensureDatabase() {
  if (process.env.MYSQL_URL || process.env.DATABASE_URL) return;
  const { host, port, user, password, database } = connectionTarget();
  const admin = await mysql.createConnection({ host, port, user, password });
  try {
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await admin.end();
  }
}

/** Comprueba que la base de datos responde. Se llama al arrancar el servidor. */
export async function assertDbConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

export default pool;
