import 'dotenv/config';
import app from './app.js';
import { assertDbConnection } from './config/db.js';
import { runMigrations } from './db/init.js';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await assertDbConnection();
    console.log('✅ Conexión a MySQL establecida');

    await runMigrations();
    console.log('✅ Migraciones aplicadas');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API escuchando en el puerto ${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} recibido. Cerrando servidor...`);
      server.close(() => process.exit(0));
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('❌ No se pudo arrancar la aplicación:', err.message);
    process.exit(1);
  }
}

start();
