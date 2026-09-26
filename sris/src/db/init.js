import pool from '../config/db.js';

/**
 * Crea las tablas necesarias si no existen. Se ejecuta al arrancar, de modo que
 * no hay pasos manuales de migración.
 */
export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      email VARCHAR(180) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      rol ENUM('auditor', 'administrador') NOT NULL DEFAULT 'auditor',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS incidentes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(150) NOT NULL,
      descripcion TEXT NOT NULL,
      tipo ENUM('acceso_no_autorizado','fuga_datos','malware','vulnerabilidad','phishing','otro') NOT NULL,
      severidad ENUM('critica','alta','media','baja') NOT NULL,
      estado ENUM('abierto','en_investigacion','resuelto','cerrado') NOT NULL DEFAULT 'abierto',
      sistema_afectado VARCHAR(180) NOT NULL,
      auditor_id INT NOT NULL,
      fecha_deteccion DATETIME NOT NULL,
      observaciones TEXT NULL,
      eliminado BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_estado (estado),
      INDEX idx_severidad (severidad),
      INDEX idx_eliminado (eliminado),
      CONSTRAINT fk_incidente_auditor FOREIGN KEY (auditor_id) REFERENCES usuarios(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}
