/**
 * DIAGNOSIS CONTROLLER - HTTP request/response handling
 * 
 * This file handles HTTP requests for diagnosis master operations.
 * Controllers are responsible for:
 * - Request validation
 * - Response formatting
 * - Error handling
 * - Delegating to service layer
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  createDiagnosisSchema,
  updateDiagnosisSchema,
  getDiagnosesQuerySchema,
  DiagnosisIdSchema,
} from '../validators/diagnosis.validators';
import * as diagnosisService from '../services/diagnosis.service';

// ===================================================================
// 🎯 CONTROLLER FUNCTIONS
// ===================================================================

/**
 * GET /diagnosis
 * Get all diagnoses with filtering and pagination
 */
export async function getDiagnosesController(req: Request, res: Response) {
  try {
    // Validate query parameters
    const queryValidation = getDiagnosesQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid query parameters',
        errors: queryValidation.error.errors,
      });
    }

    // Update request with validated query
    req.query = queryValidation.data as any;

    const result = await diagnosisService.getDiagnoses(req as any);
    
    // The service returns ApiResponse format, so we need to extract the status
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
    
  } catch (error: any) {
    console.error('Get diagnoses controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR',
    });
  }
}

/**
 * GET /diagnosis/:id
 * Get diagnosis by ID
 */
export async function getDiagnosisByIdController(req: Request, res: Response) {
  try {
    // Validate ID parameter
    const paramValidation = DiagnosisIdSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid diagnosis ID',
        errors: paramValidation.error.errors,
      });
    }

    const result = await diagnosisService.getDiagnosisById(req as any);
    
    // Determine status code based on result
    let statusCode = StatusCodes.OK;
    if (!result.success) {
      if (result.message.includes('not found')) {
        statusCode = StatusCodes.NOT_FOUND;
      } else if (result.message.includes('Authentication')) {
        statusCode = StatusCodes.UNAUTHORIZED;
      } else {
        statusCode = StatusCodes.BAD_REQUEST;
      }
    }
    
    res.status(statusCode).json(result);
    
  } catch (error: any) {
    console.error('Get diagnosis by ID controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR',
    });
  }
}

/**
 * POST /diagnosis
 * Create new diagnosis
 */
export async function createDiagnosisController(req: Request, res: Response) {
  try {
    // Validate request body
    const bodyValidation = createDiagnosisSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid input data',
        errors: bodyValidation.error.errors,
      });
    }

    // Update request with validated body
    req.body = bodyValidation.data;

    const result = await diagnosisService.createDiagnosis(req as any);
    
    // Determine status code
    let statusCode = StatusCodes.CREATED;
    if (!result.success) {
      if (result.message.includes('Authentication')) {
        statusCode = StatusCodes.UNAUTHORIZED;
      } else if (result.message.includes('permissions')) {
        statusCode = StatusCodes.FORBIDDEN;
      } else if (result.message.includes('already exists')) {
        statusCode = StatusCodes.CONFLICT;
      } else {
        statusCode = StatusCodes.BAD_REQUEST;
      }
    }
    
    res.status(statusCode).json(result);
    
  } catch (error: any) {
    console.error('Create diagnosis controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR',
    });
  }
}

/**
 * PUT /diagnosis/:id
 * Update diagnosis
 */
export async function updateDiagnosisController(req: Request, res: Response) {
  try {
    // Validate ID parameter
    const paramValidation = DiagnosisIdSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid diagnosis ID',
        errors: paramValidation.error.errors,
      });
    }

    // Validate request body
    const bodyValidation = updateDiagnosisSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid input data',
        errors: bodyValidation.error.errors,
      });
    }

    // Update request with validated body
    req.body = bodyValidation.data;

    const result = await diagnosisService.updateDiagnosis(req as any);
    
    // Determine status code
    let statusCode = StatusCodes.OK;
    if (!result.success) {
      if (result.message.includes('not found')) {
        statusCode = StatusCodes.NOT_FOUND;
      } else if (result.message.includes('Authentication')) {
        statusCode = StatusCodes.UNAUTHORIZED;
      } else if (result.message.includes('permissions')) {
        statusCode = StatusCodes.FORBIDDEN;
      } else if (result.message.includes('already exists')) {
        statusCode = StatusCodes.CONFLICT;
      } else {
        statusCode = StatusCodes.BAD_REQUEST;
      }
    }
    
    res.status(statusCode).json(result);
    
  } catch (error: any) {
    console.error('Update diagnosis controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR',
    });
  }
}

/**
 * DELETE /diagnosis/:id
 * Delete diagnosis
 */
export async function deleteDiagnosisController(req: Request, res: Response) {
  try {
    // Validate ID parameter
    const paramValidation = DiagnosisIdSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid diagnosis ID',
        errors: paramValidation.error.errors,
      });
    }

    const result = await diagnosisService.deleteDiagnosis(req as any);
    
    // Determine status code
    let statusCode = StatusCodes.OK;
    if (!result.success) {
      if (result.message.includes('not found')) {
        statusCode = StatusCodes.NOT_FOUND;
      } else if (result.message.includes('Authentication')) {
        statusCode = StatusCodes.UNAUTHORIZED;
      } else if (result.message.includes('permissions')) {
        statusCode = StatusCodes.FORBIDDEN;
      } else if (result.message.includes('being used')) {
        statusCode = StatusCodes.CONFLICT;
      } else {
        statusCode = StatusCodes.BAD_REQUEST;
      }
    }
    
    res.status(statusCode).json(result);
    
  } catch (error: any) {
    console.error('Delete diagnosis controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR',
    });
  }
}

/**
 * GET /diagnosis/body-areas
 * Get unique body areas
 */
export async function getBodyAreasController(req: Request, res: Response) {
  try {
    const result = await diagnosisService.getBodyAreas(req as any);
    
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
    
  } catch (error: any) {
    console.error('Get body areas controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR',
    });
  }
}

/**
 * GET /diagnosis/group-types
 * Get unique group types
 */
export async function getGroupTypesController(req: Request, res: Response) {
  try {
    const result = await diagnosisService.getGroupTypes(req as any);
    
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
    
  } catch (error: any) {
    console.error('Get group types controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR',
    });
  }
}
