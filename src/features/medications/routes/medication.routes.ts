/**
 * MEDICATION ROUTES - HTTP route definitions
 * 
 * This file defines all HTTP routes for medication master operations.
 * Includes authentication middleware for security.
 */

import { Router } from 'express';
import * as medicationController from '../controllers/medication.controller';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';

const router = Router();

// ===================================================================
// 🎯 ROUTE DEFINITIONS
// ===================================================================

/**
 * @route   GET /api/v1/medications
 * @desc    Get all medications with filtering and pagination
 * @access  Private (requires authentication)
 */
router.get(
  '/',
  authenticate,
  medicationController.getAllMedications
);

/**
 * @route   GET /api/v1/medications/stats
 * @desc    Get medication statistics
 * @access  Private (requires authentication)
 */
router.get(
  '/stats',
  authenticate,
  medicationController.getMedicationStats
);

/**
 * @route   GET /api/v1/medications/:id
 * @desc    Get a single medication by ID
 * @access  Private (requires authentication)
 */
router.get(
  '/:id',
  authenticate,
  medicationController.getMedicationById
);

/**
 * @route   POST /api/v1/medications
 * @desc    Create a new medication
 * @access  Private (requires authentication)
 */
router.post(
  '/',
  authenticate,
  medicationController.createMedication
);

/**
 * @route   PUT /api/v1/medications/:id
 * @desc    Update an existing medication
 * @access  Private (requires authentication)
 */
router.put(
  '/:id',
  authenticate,
  medicationController.updateMedication
);

/**
 * @route   DELETE /api/v1/medications/:id
 * @desc    Delete a medication
 * @access  Private (requires authentication)
 */
router.delete(
  '/:id',
  authenticate,
  medicationController.deleteMedication
);

export default router;
