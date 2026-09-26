import { Router } from 'express';
import authRoutes from './auth.routes.js';
import incidentesRoutes from './incidentes.routes.js';

const router = Router();

// Documentación mínima de la API en la raíz.
router.get('/', (req, res) => {
  res.json({
    name: 'SRIS — Sistema de Registro de Incidentes de Seguridad',
    version: '1.0.0',
    prefijo: '/api/v1',
    endpoints: {
      login: 'POST /api/v1/auth/login',
      crearIncidente: 'POST /api/v1/incidentes',
      listarIncidentes: 'GET /api/v1/incidentes?estado=&severidad=&page=&limit=',
      detalleIncidente: 'GET /api/v1/incidentes/:id',
      actualizarEstado: 'PATCH /api/v1/incidentes/:id/estado',
      eliminarIncidente: 'DELETE /api/v1/incidentes/:id',
      health: 'GET /health',
    },
  });
});

router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/incidentes', incidentesRoutes);

export default router;
