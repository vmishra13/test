import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticate } from '@features/auth/middlewares';
import { ApiResponse } from '@shared/utils/api-response';
import * as exerciseService from './services/exercise.service';
import logger from '@config/logger';

const router = Router();

/**
 * GET /exercises
 * List all exercises with STRICT client isolation
 */
router.get('/', authenticate, async (req, res) => {
  try {
    // Use secure service with client validation
    const result = await exerciseService.getExercises(req as any);

    res.status(StatusCodes.OK).json(ApiResponse.success(result.data, result.message));
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Client isolation enforced',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.error('Error in GET /exercises:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve exercises')
    );
  }
});

/**
 * POST /exercises
 * Create a new exercise with STRICT role authorization
 */
router.post('/', authenticate, async (req, res) => {
  try {
    // Use secure service with role and client validation
    const result = await exerciseService.createExercise(req as any);

    res.status(StatusCodes.CREATED).json(ApiResponse.success(result.data, result.message));
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Insufficient permissions',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.error('Error in POST /exercises:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to create exercise')
    );
  }
});

/**
 * GET /exercises/:exerciseId
 * Get a specific exercise with STRICT client validation
 */
router.get('/:exerciseId', authenticate, async (req, res) => {
  try {
    // Use secure service with client validation
    const result = await exerciseService.getExerciseById(req as any);

    res.status(StatusCodes.OK).json(ApiResponse.success(result.data, result.message));
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Exercise not found or access denied',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.error('Error in GET /exercises/:exerciseId:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve exercise')
    );
  }
});

/**
 * PUT /exercises/:exerciseId
 * Update a specific exercise with STRICT role and client validation
 */
router.put('/:exerciseId', authenticate, async (req, res) => {
  try {
    // Use secure service with role and client validation
    const result = await exerciseService.updateExercise(req as any);

    res.status(StatusCodes.OK).json(ApiResponse.success(result.data, result.message));
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Insufficient permissions or exercise not found',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.error('Error in PUT /exercises/:exerciseId:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to update exercise')
    );
  }
});

/**
 * DELETE /exercises/:exerciseId
 * Delete a specific exercise with STRICT role and client validation
 */
router.delete('/:exerciseId', authenticate, async (req, res) => {
  try {
    // Use secure service with role and client validation
    const result = await exerciseService.deleteExercise(req as any);

    res.status(StatusCodes.OK).json(ApiResponse.success(result.data, result.message));
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Insufficient permissions or exercise not found',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.error('Error in DELETE /exercises/:exerciseId:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to delete exercise')
    );
  }
});

/**
 * GET /exercises/search
 * Search exercises by name or description with STRICT client isolation
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    // Use secure service with client validation
    const result = await exerciseService.searchExercises(req as any);

    res.status(StatusCodes.OK).json(ApiResponse.success(result.data, result.message));
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Client isolation enforced',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.error('Error in GET /exercises/search:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to search exercises')
    );
  }
});

export default router;