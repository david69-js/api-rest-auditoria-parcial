import 'dotenv/config';

import app from './app.js';
import { assertDbConnection, ensureDatabase } from './config/db.js';
import { runMigrations } from './db/init.js';
import { runSeed } from './db/seed.js';
import { PORT, SEED_ON_START } from './config/env.js';

async function start() {
  try {
    await ensureDatabase();

    await assertDbConnection();
    console.log('✅ Conexión a MySQL establecida');

    await runMigrations();
    console.log('✅ Migraciones aplicadas');

    if (SEED_ON_START) {
      await runSeed();
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SRIS escuchando en el puerto ${PORT} (prefijo /api/v1)`);
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} recibido. Cerrando servidor...`);
      server.close(() => process.exit(0));
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('❌ No se pudo arrancar SRIS:', err.message);
    process.exit(1);
  }
}

start();
