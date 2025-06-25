/**
 * EXERCISE FEATURE ROUTES ENTRY POINT
 * 
 * This file serves as the main entry point for all exercise-related routes.
 * It imports and exports the exercise routes for use in the main API router.
 */

import { Router } from 'express';
import exerciseRoutes from './routes/exercise.routes';

const router = Router();

// Mount exercise routes
router.use('/', exerciseRoutes);

export default router;
