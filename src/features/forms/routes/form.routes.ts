/**
 * FORM ROUTES - HTTP route definitions
 * 
 * This file defines all HTTP routes for form master operations.
 * Includes authentication middleware for security and multi-tenancy.
 */

import { Router } from 'express';
import * as formController from '../controllers/form.controller';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';

const router = Router();

// ===================================================================
// 🎯 ROUTE DEFINITIONS
// ===================================================================

/**
 * @route   GET /api/v1/forms/health
 * @desc    Health check for forms feature
 * @access  Public
 */
router.get(
  '/health',
  formController.healthCheck
);

/**
 * @route   GET /api/v1/forms
 * @desc    Get all forms with filtering and pagination
 * @access  Private (requires authentication)
 */
router.get(
  '/',
  authenticate,
  formController.getAllForms
);

/**
 * @route   GET /api/v1/forms/search
 * @desc    Search forms by criteria
 * @access  Private (requires authentication)
 */
router.get(
  '/search',
  authenticate,
  formController.searchForms
);

/**
 * @route   GET /api/v1/forms/export
 * @desc    Export forms data
 * @access  Private (requires authentication)
 */
router.get(
  '/export',
  authenticate,
  formController.exportForms
);

/**
 * @route   GET /api/v1/forms/stats
 * @desc    Get form statistics
 * @access  Private (requires authentication)
 */
router.get(
  '/stats',
  authenticate,
  formController.getFormStats
);

/**
 * @route   GET /api/v1/forms/:id
 * @desc    Get a single form by ID
 * @access  Private (requires authentication)
 */
router.get(
  '/:id',
  authenticate,
  formController.getFormById
);

/**
 * @route   POST /api/v1/forms
 * @desc    Create a new form
 * @access  Private (requires authentication)
 */
router.post(
  '/',
  authenticate,
  formController.createForm
);

/**
 * @route   POST /api/v1/forms/bulk
 * @desc    Create multiple forms
 * @access  Private (requires authentication)
 */
router.post(
  '/bulk',
  authenticate,
  formController.createBulkForms
);

/**
 * @route   PUT /api/v1/forms/:id
 * @desc    Update an existing form
 * @access  Private (requires authentication)
 */
router.put(
  '/:id',
  authenticate,
  formController.updateForm
);

/**
 * @route   PATCH /api/v1/forms/:id
 * @desc    Partially update an existing form
 * @access  Private (requires authentication)
 */
router.patch(
  '/:id',
  authenticate,
  formController.updateForm
);

/**
 * @route   DELETE /api/v1/forms/:id
 * @desc    Delete a form (soft delete)
 * @access  Private (requires authentication)
 */
router.delete(
  '/:id',
  authenticate,
  formController.deleteForm
);

/**
 * @route   DELETE /api/v1/forms/bulk
 * @desc    Delete multiple forms (soft delete)
 * @access  Private (requires authentication)
 */
router.delete(
  '/bulk',
  authenticate,
  formController.deleteBulkForms
);

export default router;
