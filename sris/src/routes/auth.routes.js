import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';

const router = Router();

// Acceso libre — es el único endpoint que NO requiere JWT.
router.post('/login', login);

export default router;
