import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { assertDbConnection } from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { NODE_ENV } from './config/env.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check.
app.get('/health', async (req, res) => {
  try {
    await assertDbConnection();
    res.json({ success: true, message: 'Servicio operativo', data: { status: 'ok', db: 'up' }, errors: null });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: 'Servicio degradado',
      data: { status: 'degraded', db: 'down' },
      errors: null,
    });
  }
});

app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
