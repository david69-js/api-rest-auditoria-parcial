import mysql from 'mysql2/promise';

/**
 * Construye la configuración de conexión a MySQL.
 *
 * Soporta dos modos:
 *  1. Una URL de conexión completa (MYSQL_URL / DATABASE_URL) — la que
 *     inyecta Railway automáticamente al añadir el plugin de MySQL.
 *  2. Variables sueltas (DB_HOST, DB_PORT, ...) — útil para docker-compose
 *     y desarrollo local.
 */
function buildPoolConfig() {
  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

  const base = {
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
  };

  if (connectionUrl) {
    return { uri: connectionUrl, ...base };
  }

  return {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database:
      process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'app',
    ...base,
  };
}

const pool = mysql.createPool(buildPoolConfig());

/**
 * Comprueba que la base de datos responde. Se llama al arrancar el servidor.
 */
export async function assertDbConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

export default pool;
