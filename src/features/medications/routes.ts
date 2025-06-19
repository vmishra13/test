import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@/shared/utils/api-response';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import * as medicationService from './services/medication.service';

const router = Router();

/**
 * GET /medications
 * List all medications with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to medications within same client or SuperAdmin cross-client access
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await medicationService.getMedications(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

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
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Get medications error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve medications')
    );
  }
});

/**
 * GET /medications/:medicationId
 * Get a specific medication with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to medications within same client or SuperAdmin cross-client access
 */
router.get('/:medicationId', authenticate, async (req, res) => {
  try {
    const result = await medicationService.getMedicationById(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

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
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Get medication error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve medication')
    );
  }
});

/**
 * POST /medications
 * Create a new medication with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can create medications
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const result = await medicationService.createMedication(req as any);
    res.status(StatusCodes.CREATED).json(result);
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Insufficient permissions for medication creation',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Create medication error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to create medication')
    );
  }
});

/**
 * PUT /medications/:medicationId
 * Update a medication with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can update medications
 */
router.put('/:medicationId', authenticate, async (req, res) => {
  try {
    const result = await medicationService.updateMedication(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Insufficient permissions for medication update',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Update medication error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to update medication')
    );
  }
});

/**
 * DELETE /medications/:medicationId
 * Delete a medication with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can delete medications
 */
router.delete('/:medicationId', authenticate, async (req, res) => {
  try {
    const result = await medicationService.deleteMedication(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed - Insufficient permissions for medication deletion',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Delete medication error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to delete medication')
    );
  }
});

/**
 * GET /medications/search
 * Search medications with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows search within same client or SuperAdmin cross-client access
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const result = await medicationService.searchMedications(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    // Handle specific error types from secure service
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

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
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Search medications error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to search medications')
    );
  }
});

export default router;