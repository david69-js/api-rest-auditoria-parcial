import { Router } from 'express';
import usersRoutes from './users.routes.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    name: 'api-rest',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
    },
  });
});

router.use('/api/users', usersRoutes);

export default router;
