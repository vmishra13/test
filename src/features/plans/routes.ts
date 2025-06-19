import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@/shared/utils/api-response';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
// Import care plan controller functions
import * as carePlanController from './controllers/care-plan.controller';
// Import secure treatment plan services
import {
  getTreatmentPlans,
  getTreatmentPlanById,
  createTreatmentPlan,
  updateTreatmentPlan,
  deleteTreatmentPlan,
  searchTreatmentPlans
} from './services/treatment-plan.service';

const router = Router();

/**
 * GET /plans
 * List all treatment plans with STRICT multi-tenant security
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await getTreatmentPlans(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    console.error('Get plans error:', error);
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json(
      ApiResponse.error(error.message || 'Failed to retrieve plans', error.details)
    );
  }
});

/**
 * GET /plans/:planId
 * Get a specific treatment plan with STRICT multi-tenant security
 */
router.get('/:planId', authenticate, async (req, res) => {
  try {
    const result = await getTreatmentPlanById(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    console.error('Get plan error:', error);
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json(
      ApiResponse.error(error.message || 'Failed to retrieve plan', error.details)
    );
  }
});

/**
 * POST /plans
 * Create a new treatment plan with STRICT multi-tenant security
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const result = await createTreatmentPlan(req as any);
    res.status(StatusCodes.CREATED).json(result);
  } catch (error: any) {
    console.error('Create plan error:', error);
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json(
      ApiResponse.error(error.message || 'Failed to create plan', error.details)
    );
  }
});

/**
 * PUT /plans/:planId
 * Update a treatment plan with STRICT multi-tenant security
 */
router.put('/:planId', authenticate, async (req, res) => {
  try {
    const result = await updateTreatmentPlan(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    console.error('Update plan error:', error);
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json(
      ApiResponse.error(error.message || 'Failed to update plan', error.details)
    );
  }
});

/**
 * DELETE /plans/:planId
 * Delete a treatment plan with STRICT multi-tenant security
 */
router.delete('/:planId', authenticate, async (req, res) => {
  try {
    const result = await deleteTreatmentPlan(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    console.error('Delete plan error:', error);
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json(
      ApiResponse.error(error.message || 'Failed to delete plan', error.details)
    );
  }
});

/**
 * GET /plans/search
 * Search treatment plans with STRICT multi-tenant security
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const result = await searchTreatmentPlans(req as any);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    console.error('Search plans error:', error);
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json(
      ApiResponse.error(error.message || 'Failed to search plans', error.details)
    );
  }
});

// ===================================================================
// 🎯 CARE PLAN ENDPOINTS
// ===================================================================

// Get or create care plan
router.get('/users/:userId/care-plan', authenticate, (req, res) => 
  carePlanController.getCarePlan(req as any, res)
);

// Update care plan
router.put('/users/:userId/care-plan', authenticate, (req, res) => 
  carePlanController.updateCarePlan(req as any, res)
);

// Get user's injuries
router.get('/users/:userId/injuries', authenticate, (req, res) => 
  carePlanController.getInjuries(req as any, res)
);

// Track or update injury
router.post('/users/:userId/injuries', authenticate, (req, res) => 
  carePlanController.trackInjury(req as any, res)
);

// Get learning center content (doesn't need userId)
router.get('/learning-center', authenticate, (req, res) => 
  carePlanController.getLearningCenter(req as any, res)
);

export default router;