/**
 * FORM CONTROLLER - HTTP request handlers
 * 
 * This file handles HTTP requests for form operations.
 * It validates input, calls services, and returns standardized responses.
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as formService from '../services/form.service';
import { ApiResponse } from '@shared/utils/api-response';
import type { CreateFormDto, UpdateFormDto, FormQueryDto } from '../dto';

// ===================================================================
// 🎯 CONTROLLER FUNCTIONS
// ===================================================================

/**
 * Get all forms with filtering and pagination
 * GET /api/v1/forms
 */
export async function getAllForms(req: Request, res: Response): Promise<void> {
  try {
    const query: FormQueryDto = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      search: req.query.search as string,
      sortBy: req.query.sortBy as 'name' | 'crDate' | 'modDate',
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const clientId = (req as any).user?.clientId;
    if (!clientId) {
      const response = ApiResponse.error(
        'Client ID not found in request',
        'UNAUTHORIZED',
        'Missing client context'
      );
      res.status(StatusCodes.UNAUTHORIZED).json(response);
      return;
    }

    const result = await formService.getAllForms(query, clientId);
    
    const response = ApiResponse.success(
      result,
      'Forms retrieved successfully'
    );
    
    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    console.error('Error in getAllForms:', error);
    
    const response = ApiResponse.error(
      'Failed to retrieve forms',
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}

/**
 * Get form by ID
 * GET /api/v1/forms/:id
 */
export async function getFormById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const clientId = (req as any).user?.clientId;

    if (!clientId) {
      const response = ApiResponse.error(
        'Client ID not found in request',
        'UNAUTHORIZED',
        'Missing client context'
      );
      res.status(StatusCodes.UNAUTHORIZED).json(response);
    }

    if (isNaN(id) || id <= 0) {
      const response = ApiResponse.error(
        'Invalid form ID',
        'VALIDATION_ERROR',
        'Form ID must be a positive integer'
      );
      res.status(StatusCodes.BAD_REQUEST).json(response);
    }

    const form = await formService.getFormById(id, clientId);
    
    const response = ApiResponse.success(
      form,
      'Form retrieved successfully'
    );
    
    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    console.error('Error in getFormById:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      const response = ApiResponse.error(
        'Form not found',
        'NOT_FOUND',
        error.message
      );
      res.status(StatusCodes.NOT_FOUND).json(response);
    }

    const response = ApiResponse.error(
      'Failed to retrieve form',
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}

/**
 * Create a new form
 * POST /api/v1/forms
 */
export async function createForm(req: Request, res: Response): Promise<void> {
  try {
    const data: CreateFormDto = req.body;
    const clientId = (req as any).user?.clientId;
    const modUser = (req as any).user?.id || 'system';

    if (!clientId) {
      const response = ApiResponse.error(
        'Client ID not found in request',
        'UNAUTHORIZED',
        'Missing client context'
      );
      res.status(StatusCodes.UNAUTHORIZED).json(response);
    }

    const form = await formService.createForm(data, clientId, modUser);
    
    const response = ApiResponse.success(
      form,
      'Form created successfully'
    );
    
    res.status(StatusCodes.CREATED).json(response);
  } catch (error) {
    console.error('Error in createForm:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        const response = ApiResponse.error(
          'Form name already exists',
          'CONFLICT',
          error.message
        );
        res.status(StatusCodes.CONFLICT).json(response);
      }
      
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        const response = ApiResponse.error(
          'Validation error',
          'VALIDATION_ERROR',
          error.message
        );
        res.status(StatusCodes.BAD_REQUEST).json(response);
      }
    }

    const response = ApiResponse.error(
      'Failed to create form',
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}

/**
 * Update form by ID
 * PUT /api/v1/forms/:id
 */
export async function updateForm(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const data: UpdateFormDto = req.body;
    const clientId = (req as any).user?.clientId;
    const modUser = (req as any).user?.id || 'system';

    if (!clientId) {
      const response = ApiResponse.error(
        'Client ID not found in request',
        'UNAUTHORIZED',
        'Missing client context'
      );
      res.status(StatusCodes.UNAUTHORIZED).json(response);
    }

    if (isNaN(id) || id <= 0) {
      const response = ApiResponse.error(
        'Invalid form ID',
        'VALIDATION_ERROR',
        'Form ID must be a positive integer'
      );
      res.status(StatusCodes.BAD_REQUEST).json(response);
    }

    const form = await formService.updateForm(id, data, clientId, modUser);
    
    const response = ApiResponse.success(
      form,
      'Form updated successfully'
    );
    
    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    console.error('Error in updateForm:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        const response = ApiResponse.error(
          'Form not found',
          'NOT_FOUND',
          error.message
        );
        res.status(StatusCodes.NOT_FOUND).json(response);
      }
      
      if (error.message.includes('already exists')) {
        const response = ApiResponse.error(
          'Form name already exists',
          'CONFLICT',
          error.message
        );
        res.status(StatusCodes.CONFLICT).json(response);
      }
      
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        const response = ApiResponse.error(
          'Validation error',
          'VALIDATION_ERROR',
          error.message
        );
        res.status(StatusCodes.BAD_REQUEST).json(response);
      }
    }

    const response = ApiResponse.error(
      'Failed to update form',
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}

/**
 * Delete form by ID
 * DELETE /api/v1/forms/:id
 */
export async function deleteForm(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const clientId = (req as any).user?.clientId;

    if (!clientId) {
      const response = ApiResponse.error(
        'Client ID not found in request',
        'UNAUTHORIZED',
        'Missing client context'
      );
      res.status(StatusCodes.UNAUTHORIZED).json(response);
    }

    if (isNaN(id) || id <= 0) {
      const response = ApiResponse.error(
        'Invalid form ID',
        'VALIDATION_ERROR',
        'Form ID must be a positive integer'
      );
      res.status(StatusCodes.BAD_REQUEST).json(response);
    }

    const result = await formService.deleteForm(id, clientId);
    
    const response = ApiResponse.success(
      result,
      'Form deleted successfully'
    );
    
    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    console.error('Error in deleteForm:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      const response = ApiResponse.error(
        'Form not found',
        'NOT_FOUND',
        error.message
      );
      res.status(StatusCodes.NOT_FOUND).json(response);
    }

    const response = ApiResponse.error(
      'Failed to delete form',
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}

/**
 * Get form statistics
 * GET /api/v1/forms/stats
 */
export async function getFormStats(req: Request, res: Response): Promise<void> {
  try {
    const clientId = (req as any).user?.clientId;

    if (!clientId) {
      const response = ApiResponse.error(
        'Client ID not found in request',
        'UNAUTHORIZED',
        'Missing client context'
      );
      res.status(StatusCodes.UNAUTHORIZED).json(response);
    }

    const stats = await formService.getFormStatistics(clientId);
    
    const response = ApiResponse.success(
      stats,
      'Form statistics retrieved successfully'
    );
    
    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    console.error('Error in getFormStats:', error);
    
    const response = ApiResponse.error(
      'Failed to retrieve form statistics',
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}

/**
 * Bulk delete forms
 * DELETE /api/v1/forms/bulk
 */
export async function deleteBulkForms(req: Request, res: Response): Promise<void> {
  try {
    const { formIds } = req.body;
    const clientId = (req as any).user?.clientId;

    if (!clientId) {
      const response = ApiResponse.error(
        'Client ID not found in request',
        'UNAUTHORIZED',
        'Missing client context'
      );
      res.status(StatusCodes.UNAUTHORIZED).json(response);
    }

    if (!formIds || !Array.isArray(formIds) || formIds.length === 0) {
      const response = ApiResponse.error(
        'Invalid request',
        'VALIDATION_ERROR',
        'Form IDs array is required'
      );
      res.status(StatusCodes.BAD_REQUEST).json(response);
    }

    const result = await formService.bulkDeleteForms(formIds, clientId);
    
    const response = ApiResponse.success(
      result,
      result.message
    );
    
    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    console.error('Error in bulkDeleteForms:', error);
    
    if (error instanceof Error && error.message.includes('Cannot delete more than')) {
      const response = ApiResponse.error(
        'Too many forms',
        'VALIDATION_ERROR',
        error.message
      );
      res.status(StatusCodes.BAD_REQUEST).json(response);
    }

    const response = ApiResponse.error(
      'Failed to bulk delete forms',
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}

/**
 * Validate form name
 * POST /api/v1/forms/validate-name
 */
export async function validateFormName(req: Request, res: Response) {
  try {
    const { name, excludeId } = req.body;
    const clientId = (req as any).user?.clientId;

    if (!clientId) {
      const response = ApiResponse.error(
        'Client ID not found in request',
        'UNAUTHORIZED',
        'Missing client context'
      );
      res.status(StatusCodes.UNAUTHORIZED).json(response);
    }

    if (!name || typeof name !== 'string') {
      const response = ApiResponse.error(
        'Invalid request',
        'VALIDATION_ERROR',
        'Form name is required'
      );
      res.status(StatusCodes.BAD_REQUEST).json(response);
    }

    const result = await formService.validateFormName(name, clientId, excludeId);
    
    const response = ApiResponse.success(
      result,
      'Form name validation completed'
    );
    
    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    console.error('Error in validateFormName:', error);
    
    const response = ApiResponse.error(
      'Failed to validate form name',
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}

/**
 * Search forms
 * GET /api/v1/forms/search
 */
export async function searchForms(req: Request, res: Response): Promise<void> {
  try {
    const { q: searchTerm, page, limit, sortBy, sortOrder } = req.query;
    const clientId = (req as any).user?.clientId;

    if (!clientId) {
      const response = ApiResponse.error(
        'Client ID not found in request',
        'UNAUTHORIZED',
        'Missing client context'
      );
      res.status(StatusCodes.UNAUTHORIZED).json(response);
    }

    if (!searchTerm || typeof searchTerm !== 'string') {
      const response = ApiResponse.error(
        'Search term is required',
        'VALIDATION_ERROR',
        'Query parameter "q" is required'
      );
      res.status(StatusCodes.BAD_REQUEST).json(response);
    }

    const options = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string,
    };

    const result = await formService.searchForms(searchTerm as string, clientId, options);
    
    const response = ApiResponse.success(
      result,
      'Forms search completed successfully'
    );
    
    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    console.error('Error in searchForms:', error);
    
    const response = ApiResponse.error(
      'Failed to search forms',
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}

/**
 * Export forms
 * GET /api/v1/forms/export
 */
export async function exportForms(req: Request, res: Response): Promise<void> {
  try {
    const clientId = (req as any).user?.clientId;

    if (!clientId) {
      const response = ApiResponse.error(
        'Client ID not found in request',
        'UNAUTHORIZED',
        'Missing client context'
      );
      res.status(StatusCodes.UNAUTHORIZED).json(response);
    }

    const result = await formService.exportForms(clientId);
    
    const response = ApiResponse.success(
      result,
      'Forms exported successfully'
    );
    
    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    console.error('Error in exportForms:', error);
    
    const response = ApiResponse.error(
      'Failed to export forms',
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}

/**
 * Health check endpoint
 * GET /api/v1/forms/health
 */
export async function healthCheck(req: Request, res: Response): Promise<void> {
  try {
    const result = await formService.healthCheck();
    
    const statusCode = result.status === 'healthy' 
      ? StatusCodes.OK 
      : StatusCodes.SERVICE_UNAVAILABLE;

    const response = ApiResponse.success(
      result,
      `Form service is ${result.status}`
    );
    
    res.status(statusCode).json(response);
  } catch (error) {
    console.error('Error in healthCheck:', error);
    
    const response = ApiResponse.error(
      'Health check failed',
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}

/**
 * Create multiple forms
 * POST /api/v1/forms/bulk
 */
export async function createBulkForms(req: Request, res: Response): Promise<void> {
  try {
    const { forms } = req.body;
    const clientId = (req as any).user?.clientId;
    const modUser = (req as any).user?.id || 'system';

    if (!clientId) {
      const response = ApiResponse.error(
        'Client ID not found in request',
        'UNAUTHORIZED',
        'Missing client context'
      );
      res.status(StatusCodes.UNAUTHORIZED).json(response);
      return;
    }

    if (!forms || !Array.isArray(forms) || forms.length === 0) {
      const response = ApiResponse.error(
        'Invalid request',
        'VALIDATION_ERROR',
        'Forms array is required and cannot be empty'
      );
      res.status(StatusCodes.BAD_REQUEST).json(response);
      return;
    }

    const createdForms = [];
    const errors = [];

    for (let i = 0; i < forms.length; i++) {
      try {
        const formData: CreateFormDto = forms[i];
        const newForm = await formService.createForm(formData, clientId, modUser);
        createdForms.push(newForm);
      } catch (error) {
        errors.push({
          index: i,
          form: forms[i],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const response = ApiResponse.success(
      {
        created: createdForms,
        errors: errors,
        summary: {
          total: forms.length,
          created: createdForms.length,
          failed: errors.length
        }
      },
      `Bulk form creation completed. ${createdForms.length} created, ${errors.length} failed.`
    );
    
    res.status(StatusCodes.CREATED).json(response);
  } catch (error) {
    const response = ApiResponse.error(
      'Failed to create forms',
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}
