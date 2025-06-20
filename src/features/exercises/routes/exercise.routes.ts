/**
 * EXERCISE ROUTES - HTTP route definitions
 * 
 * This file defines all HTTP routes for exercise master operations.
 * Includes authentication middleware for security.
 */

import { Router } from 'express';
import * as exerciseController from '../controllers/exercise.controller';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';

const router = Router();

// ===================================================================
// 🎯 ROUTE DEFINITIONS
// ===================================================================

/**
 * @route   GET /api/v1/exercises
 * @desc    Get all exercises with filtering and pagination
 * @access  Private (requires authentication)
 */
router.get(
  '/',
  authenticate,
  exerciseController.getAllExercises
);

/**
 * @route   GET /api/v1/exercises/stats
 * @desc    Get exercise statistics
 * @access  Private (requires authentication)
 */
router.get(
  '/stats',
  authenticate,
  exerciseController.getExerciseStats
);

/**
 * @route   GET /api/v1/exercises/:id
 * @desc    Get a single exercise by ID
 * @access  Private (requires authentication)
 */
router.get(
  '/:id',
  authenticate,
  exerciseController.getExerciseById
);

/**
 * @route   POST /api/v1/exercises
 * @desc    Create a new exercise
 * @access  Private (requires authentication)
 */
router.post(
  '/',
  authenticate,
  exerciseController.createExercise
);

/**
 * @route   PUT /api/v1/exercises/:id
 * @desc    Update an existing exercise
 * @access  Private (requires authentication)
 */
router.put(
  '/:id',
  authenticate,
  exerciseController.updateExercise
);

/**
 * @route   DELETE /api/v1/exercises/:id
 * @desc    Delete an exercise
 * @access  Private (requires authentication)
 */
router.delete(
  '/:id',
  authenticate,
  exerciseController.deleteExercise
);

export default router;
