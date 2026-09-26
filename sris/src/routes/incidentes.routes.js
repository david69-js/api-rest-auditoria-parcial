import { Router } from 'express';
import { verifyJwt, requireRole } from '../middlewares/auth.middleware.js';
import {
  crearIncidente,
  listarIncidentes,
  obtenerIncidente,
  actualizarEstado,
  eliminarIncidente,
} from '../controllers/incidentes.controller.js';

const router = Router();

// Todos los endpoints de incidentes exigen un JWT válido.
router.use(verifyJwt);

// Crear y consultar: auditor y administrador.
router.post('/', requireRole('auditor', 'administrador'), crearIncidente);
router.get('/', requireRole('auditor', 'administrador'), listarIncidentes);
router.get('/:id', requireRole('auditor', 'administrador'), obtenerIncidente);

// Actualizar estado y eliminar: solo administrador (RBAC).
router.patch('/:id/estado', requireRole('administrador'), actualizarEstado);
router.delete('/:id', requireRole('administrador'), eliminarIncidente);

export default router;
