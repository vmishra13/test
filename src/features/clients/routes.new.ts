/**
 * CLIENT ROUTES - Main Entry Point
 * 
 * This file serves as the main entry point for all client-related routes.
 * It imports and uses the refactored controller/service pattern.
 * 
 * The business logic has been moved to:
 * - Controllers: handle HTTP requests/responses
 * - Services: handle business logic and validation
 * - Repositories: handle data access
 * - DTOs: define data transfer objects
 * - Validators: handle input validation
 */

import { Router } from 'express';
import clientRoutes from './routes/client.routes';

const router = Router();

// Mount client routes
router.use('/', clientRoutes);

export default router;
