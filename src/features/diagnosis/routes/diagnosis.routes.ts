/**
 * DIAGNOSIS ROUTES - Diagnosis master route definitions
 * 
 * This file defines all HTTP routes for diagnosis master operations.
 * Routes are secured with authentication and follow RESTful conventions.
 */

import { Router } from 'express';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import {
  getDiagnosesController,
  getDiagnosisByIdController,
  createDiagnosisController,
  updateDiagnosisController,
  deleteDiagnosisController,
  getBodyAreasController,
  getGroupTypesController,
} from '../controllers/diagnosis.controller';

const router = Router();

// ===================================================================
// 🔍 READ OPERATIONS
// ===================================================================

/**
 * GET /diagnosis
 * Get all diagnoses with filtering and pagination
 * Access: All authenticated users (clinical master data)
 */
router.get('/', authenticate, getDiagnosesController);

/**
 * GET /diagnosis/body-areas
 * Get unique body areas
 * Access: All authenticated users
 */
router.get('/body-areas', authenticate, getBodyAreasController);

/**
 * GET /diagnosis/group-types
 * Get unique group types
 * Access: All authenticated users
 */
router.get('/group-types', authenticate, getGroupTypesController);

/**
 * GET /diagnosis/:id
 * Get diagnosis by ID
 * Access: All authenticated users (clinical master data)
 */
router.get('/:id', authenticate, getDiagnosisByIdController);

// ===================================================================
// ✏️ WRITE OPERATIONS
// ===================================================================

/**
 * POST /diagnosis
 * Create new diagnosis
 * Access: SUPER_ADMIN, CLIENT_ADMIN, CLINICAL_STAFF
 */
router.post('/', authenticate, createDiagnosisController);

/**
 * PUT /diagnosis/:id
 * Update diagnosis
 * Access: SUPER_ADMIN, CLIENT_ADMIN, CLINICAL_STAFF
 */
router.put('/:id', authenticate, updateDiagnosisController);

/**
 * DELETE /diagnosis/:id
 * Delete diagnosis (hard delete)
 * Access: SUPER_ADMIN only
 */
router.delete('/:id', authenticate, deleteDiagnosisController);

export default router;
