import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { assertDbConnection } from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Necesario en Railway (detrás de proxy) para IPs/rate-limit correctos.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check — Railway lo usa para saber si el servicio está vivo.
app.get('/health', async (req, res) => {
  try {
    await assertDbConnection();
    res.json({ status: 'ok', db: 'up' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', db: 'down' });
  }
});

app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
