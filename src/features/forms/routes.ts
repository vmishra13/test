/**
 * FORM FEATURE ROUTES ENTRY POINT
 * 
 * This file serves as the main entry point for all form-related routes.
 * It imports and exports the form routes for use in the main API router.
 */

import { Router } from 'express';
import formRoutes from './routes/form.routes';

const router = Router();

// Mount form routes
router.use('/', formRoutes);

export default router;
