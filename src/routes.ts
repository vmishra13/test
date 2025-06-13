import { Router } from 'express';
import apiRouter from './api';

const router = Router();

// Mount the API router
router.use('/', apiRouter);

export default router;
