import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@/shared/utils/api-response';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import * as procedureService from './services/procedure.service';

const router = Router();

/**
 * GET /procedures
 * List all medical procedures with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to procedures within same client or SuperAdmin cross-client access
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await procedureService.getProcedures(req as any);
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

    console.error('Get procedures error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve procedures')
    );
  }
});

/**
 * GET /procedures/:procedureId
 * Get a specific procedure with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows access to procedures within same client or SuperAdmin cross-client access
 */
router.get('/:procedureId', authenticate, async (req, res) => {
  try {
    const result = await procedureService.getProcedureById(req as any);
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

    console.error('Get procedure error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve procedure')
    );
  }
});

/**
 * POST /procedures
 * Create a new procedure with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can create procedures
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const result = await procedureService.createProcedure(req as any);
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
        error: 'Authorization failed - Insufficient permissions for procedure creation',
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

    console.error('Create procedure error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to create procedure')
    );
  }
});

/**
 * PUT /procedures/:procedureId
 * Update a procedure with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can update procedures
 */
router.put('/:procedureId', authenticate, async (req, res) => {
  try {
    const result = await procedureService.updateProcedure(req as any);
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
        error: 'Authorization failed - Insufficient permissions for procedure update',
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

    console.error('Update procedure error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to update procedure')
    );
  }
});

/**
 * DELETE /procedures/:procedureId
 * Delete a procedure with STRICT multi-tenant validation and role authorization
 * HIPAA/PHI Protection: Only CLIENT_ADMIN and SUPER_ADMIN can delete procedures
 */
router.delete('/:procedureId', authenticate, async (req, res) => {
  try {
    const result = await procedureService.deleteProcedure(req as any);
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
        error: 'Authorization failed - Insufficient permissions for procedure deletion',
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

    console.error('Delete procedure error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to delete procedure')
    );
  }
});

/**
 * GET /procedures/search
 * Search procedures with STRICT multi-tenant validation
 * HIPAA/PHI Protection: Only allows search within same client or SuperAdmin cross-client access
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const result = await procedureService.searchProcedures(req as any);
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

    console.error('Search procedures error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to search procedures')
    );
  }
});

export default router;