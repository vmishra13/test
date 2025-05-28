import { Router } from 'express';
import apiRouter from './api';

const router = Router();

// Mount the API router
router.use('/', apiRouter);

// Optional: Add a redirect from /api to /api/v1 for convenience
router.get('/', (req, res) => {
  res.redirect('/v1');
});

export default router;
