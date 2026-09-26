import bcrypt from 'bcryptjs';

import pool from '../config/db.js';
import * as Usuario from '../models/usuario.model.js';
import { BCRYPT_ROUNDS } from '../config/env.js';
import { toMysqlDateTime } from '../utils/sanitize.js';

// Usuarios de prueba. Las contraseñas se guardan hasheadas con bcrypt.
const USUARIOS_SEED = [
  { nombre: 'Administrador SRIS', email: 'admin@sris.local', password: 'Admin123!', rol: 'administrador' },
  { nombre: 'Auditor SRIS', email: 'auditor@sris.local', password: 'Auditor123!', rol: 'auditor' },
];

// Incidentes = auditoría de seguridad REAL del sistema hermano `api-rest`.
// Cada hallazgo apunta a evidencia concreta en su código fuente.
const INCIDENTES_SEED = [
  {
    titulo: 'Endpoints de usuarios sin autenticación',
    descripcion:
      'El recurso /api/users (GET, POST, PUT, DELETE) no exige token JWT ni ningún control de acceso: cualquier cliente puede listar, crear, modificar o eliminar usuarios. Evidencia: src/routes/users.routes.js no aplica ningún middleware de autenticación.',
    tipo: 'acceso_no_autorizado',
    severidad: 'critica',
    estado: 'abierto',
    sistema_afectado: 'api-rest / módulo usuarios',
    observaciones: 'Recomendación: exigir JWT + RBAC como en SRIS.',
  },
  {
    titulo: 'Exposición de datos personales (PII) sin control',
    descripcion:
      'GET /api/users devuelve el email de todos los usuarios sin autenticación ni paginación, exponiendo información personal. Evidencia: listUsers() en src/controllers/users.controller.js hace un SELECT de todos los registros.',
    tipo: 'fuga_datos',
    severidad: 'alta',
    estado: 'abierto',
    sistema_afectado: 'api-rest / módulo usuarios',
    observaciones: 'Recomendación: proteger con auth y paginar el listado.',
  },
  {
    titulo: 'CORS abierto a cualquier origen',
    descripcion:
      'app.use(cors()) se usa sin configuración, lo que permite peticiones desde cualquier origen (Access-Control-Allow-Origin: *). Evidencia: src/app.js.',
    tipo: 'vulnerabilidad',
    severidad: 'media',
    estado: 'abierto',
    sistema_afectado: 'api-rest / configuración',
    observaciones: 'Recomendación: restringir origins con una allowlist.',
  },
  {
    titulo: 'Ausencia de limitación de tasa (rate limiting)',
    descripcion:
      'No hay rate limiting pese a configurar "trust proxy". La API es susceptible a fuerza bruta y abuso de recursos. Evidencia: cadena de middlewares en src/app.js.',
    tipo: 'vulnerabilidad',
    severidad: 'media',
    estado: 'abierto',
    sistema_afectado: 'api-rest / configuración',
    observaciones: 'Recomendación: añadir express-rate-limit.',
  },
  {
    titulo: 'Borrado físico e irreversible de usuarios',
    descripcion:
      'DELETE /api/users/:id ejecuta "DELETE FROM users", eliminando el registro de forma definitiva sin borrado lógico ni trazabilidad de auditoría. Evidencia: deleteUser() en src/controllers/users.controller.js.',
    tipo: 'vulnerabilidad',
    severidad: 'media',
    estado: 'abierto',
    sistema_afectado: 'api-rest / módulo usuarios',
    observaciones: 'Recomendación: implementar borrado lógico (eliminado=true).',
  },
  {
    titulo: 'Campos de usuario sin saneamiento anti-XSS',
    descripcion:
      'name/email se insertan tras una validación mínima, sin escapar contenido HTML; permite almacenar payloads XSS que otro frontend podría renderizar. Evidencia: createUser()/updateUser() en src/controllers/users.controller.js.',
    tipo: 'vulnerabilidad',
    severidad: 'baja',
    estado: 'abierto',
    sistema_afectado: 'api-rest / módulo usuarios',
    observaciones: 'Recomendación: escapar/validar entradas como en SRIS.',
  },
];

/**
 * Siembra usuarios de prueba y la auditoría inicial de api-rest.
 * Solo se ejecuta si aún no hay usuarios (idempotente).
 */
export async function runSeed() {
  const total = await Usuario.count();
  if (total > 0) return;

  const idsPorRol = {};
  for (const u of USUARIOS_SEED) {
    const password_hash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
    const id = await Usuario.create({
      nombre: u.nombre,
      email: u.email,
      password_hash,
      rol: u.rol,
    });
    idsPorRol[u.rol] = id;
  }

  const auditorId = idsPorRol.auditor ?? idsPorRol.administrador;
  const ahora = toMysqlDateTime(new Date());

  for (const inc of INCIDENTES_SEED) {
    await pool.query(
      `INSERT INTO incidentes
        (titulo, descripcion, tipo, severidad, estado, sistema_afectado, auditor_id, fecha_deteccion, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inc.titulo,
        inc.descripcion,
        inc.tipo,
        inc.severidad,
        inc.estado,
        inc.sistema_afectado,
        auditorId,
        ahora,
        inc.observaciones ?? null,
      ]
    );
  }

  console.log('🌱 Datos sembrados: 2 usuarios + auditoría de api-rest (6 incidentes)');
  console.log('   👤 admin@sris.local / Admin123!      (administrador)');
  console.log('   👤 auditor@sris.local / Auditor123!  (auditor)');
}
