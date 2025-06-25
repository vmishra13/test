/**
 * MEDICATION FEATURE ROUTES ENTRY POINT
 * 
 * This file serves as the main entry point for all medication-related routes.
 * It imports and exports the medication routes for use in the main API router.
 */

import { Router } from 'express';
import medicationRoutes from './routes/medication.routes';

const router = Router();

// Mount medication routes
router.use('/', medicationRoutes);

export default router;
