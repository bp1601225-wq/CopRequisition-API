import { Router } from 'express';

import authRoutes from './auth.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
  });
});

router.get('/test', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test route is working',
  });
});

router.use('/auth', authRoutes);

export default router;
