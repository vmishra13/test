import { Request, Response } from 'express';
import { getCurrentUser } from '@features/auth';
import CarePlanService from '../services/care-plan.service';
import { ApiResponse } from '@shared/utils/api-response';
import { createAuthorizationError, createValidationError } from '@shared/errors/application-error';
import logger from '@config/logger';

const carePlanService = new CarePlanService();

/**
 * Get care plan with STRICT client validation
 * HIPAA/PHI Protection: Only returns care plans for the authenticated user's client
 */
export const getCarePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = getCurrentUser(req as any);
    const { userId } = req.params;

    if (!currentUser.clientId) {
      throw createAuthorizationError('Client context required for care plan access');
    }

    // Validate that user can only access their own care plan or if they have admin permissions
    if (userId !== currentUser.userId.toString() && !['super_admin', 'client_admin'].includes(currentUser.roles[0] || '')) {
      throw createAuthorizationError('Access denied to user care plan');
    }

    logger.info('Getting care plan with client validation', {
      userId,
      requestingUserId: currentUser.userId,
      clientId: currentUser.clientId
    });

    const result = await carePlanService.getCarePlan(userId, currentUser.clientId);
    
    res.json(ApiResponse.success(result.data, 'Care plan retrieved successfully'));
  } catch (error: any) {
    logger.error('Error getting care plan:', error);
    res.status(error.statusCode || 500).json(
      ApiResponse.error(error.message || 'Failed to get care plan')
    );
  }
};

/**
 * Update care plan with STRICT client validation
 */
export const updateCarePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = getCurrentUser(req as any);
    const { userId } = req.params;

    if (!currentUser.clientId) {
      throw createAuthorizationError('Client context required for care plan modification');
    }

    // Validate that user can only update their own care plan or if they have admin permissions
    if (userId !== currentUser.userId.toString() && !['super_admin', 'client_admin', 'clinical_staff'].includes(currentUser.roles[0] || '')) {
      throw createAuthorizationError('Access denied to modify user care plan');
    }

    logger.info('Updating care plan with client validation', {
      userId,
      requestingUserId: currentUser.userId,
      clientId: currentUser.clientId
    });

    const result = await carePlanService.updateCarePlan(userId, currentUser.clientId, req.body);
    
    res.json(ApiResponse.success(result.data, 'Care plan updated successfully'));
  } catch (error: any) {
    logger.error('Error updating care plan:', error);
    res.status(error.statusCode || 500).json(
      ApiResponse.error(error.message || 'Failed to update care plan')
    );
  }
};

/**
 * Get injuries with STRICT client validation
 */
export const getInjuries = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = getCurrentUser(req as any);
    const { userId } = req.params;

    if (!currentUser.clientId) {
      throw createAuthorizationError('Client context required for injury data access');
    }

    // Validate that user can only access their own injuries or if they have admin permissions
    if (userId !== currentUser.userId.toString() && !['super_admin', 'client_admin', 'clinical_staff'].includes(currentUser.roles[0] || '')) {
      throw createAuthorizationError('Access denied to user injury data');
    }

    logger.info('Getting injuries with client validation', {
      userId,
      requestingUserId: currentUser.userId,
      clientId: currentUser.clientId
    });

    const result = await carePlanService.getInjuries(userId, currentUser.clientId);
    
    res.json(ApiResponse.success(result.data, 'Injuries retrieved successfully'));
  } catch (error: any) {
    logger.error('Error getting injuries:', error);
    res.status(error.statusCode || 500).json(
      ApiResponse.error(error.message || 'Failed to get injuries')
    );
  }
};

/**
 * Track injury with STRICT client validation
 */
export const trackInjury = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = getCurrentUser(req as any);
    const { userId } = req.params;

    if (!currentUser.clientId) {
      throw createAuthorizationError('Client context required for injury tracking');
    }

    // Validate that user can only track their own injuries or if they have clinical permissions
    if (userId !== currentUser.userId.toString() && !['super_admin', 'client_admin', 'clinical_staff'].includes(currentUser.roles[0] || '')) {
      throw createAuthorizationError('Access denied to track user injury');
    }

    logger.info('Tracking injury with client validation', {
      userId,
      requestingUserId: currentUser.userId,
      clientId: currentUser.clientId,
      injuryType: req.body.injuryType
    });

    const result = await carePlanService.trackInjury(userId, currentUser.clientId, req.body);
    
    res.json(ApiResponse.success(result.data, 'Injury tracked successfully'));
  } catch (error: any) {
    logger.error('Error tracking injury:', error);
    res.status(error.statusCode || 500).json(
      ApiResponse.error(error.message || 'Failed to track injury')
    );
  }
};

/**
 * Get learning center content with optional client filtering
 */
export const getLearningCenter = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = getCurrentUser(req as any);
    const { category } = req.query;

    // Learning center may have public content, but personalized content requires client validation
    const userId = currentUser?.userId?.toString();
    const clientId = currentUser?.clientId;

    logger.info('Getting learning center content', {
      userId,
      clientId,
      category,
      hasAuthentication: !!currentUser
    });

    const result = await carePlanService.getLearningCenter(userId, clientId, category as string);
    
    res.json(ApiResponse.success(result.data, 'Learning center content retrieved successfully'));
  } catch (error: any) {
    logger.error('Error getting learning center content:', error);
    res.status(error.statusCode || 500).json(
      ApiResponse.error(error.message || 'Failed to get learning center content')
    );
  }
};
