/**
 * CLIENT ROUTES - Refactored to use Controller/Service pattern
 * 
 * This file handles all client-related HTTP routes and delegates
 * business logic to the ClientController and ClientService layers.
 * 
 * Route Pattern:
 * - All routes are authenticated 
 * - Authorization logic is handled in the service layer
 * - Controllers handle HTTP concerns
 * - Services handle business logic
 */

import { Router } from 'express';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import {
  getClientsController,
  getClientByIdController,
  createClientController,
  updateClientController,
  updateClientStatusController,
} from '../controllers/client.controller';

const router = Router();

// ===================================================================
// 🔍 READ OPERATIONS
// ===================================================================

/**
 * GET /clients
 * Get all clients with filtering and pagination (SUPER_ADMIN only)
 */
router.get('/', authenticate, getClientsController);

/**
 * GET /clients/:id  
 * Get client by ID with full details
 */
router.get('/:id', authenticate, getClientByIdController);

// ===================================================================
// ✏️ WRITE OPERATIONS  
// ===================================================================

/**
 * POST /clients
 * Create new client (SUPER_ADMIN only)
 */
router.post('/', authenticate, createClientController);

/**
 * PUT /clients/:id
 * Update client (SUPER_ADMIN or CLIENT_ADMIN of same client)
 */
router.put('/:id', authenticate, updateClientController);

/**
 * PATCH /clients/:id/status
 * Update client status (SUPER_ADMIN only)
 */
router.patch('/:id/status', authenticate, updateClientStatusController);

export default router;
