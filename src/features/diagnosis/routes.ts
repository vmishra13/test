/**
 * DIAGNOSIS MAIN ROUTES - Entry point for diagnosis routes
 * 
 * This file aggregates all diagnosis-related routes.
 */

import { Router } from 'express';
import diagnosisRoutes from './routes/diagnosis.routes';

const router = Router();

// Mount diagnosis routes
router.use('/', diagnosisRoutes);

export default router;
