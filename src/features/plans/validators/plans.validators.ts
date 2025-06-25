/**
 * PLANS VALIDATORS - Request validation middleware
 * 
 * This file contains validation middleware for plan-related API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { 
  CreatePlanSchema, 
  UpdatePlanSchema,
  CreatePatientPlanSchema,
  UpdatePatientPlanSchema,
  CreatePatientPlanScheduleSchema,
  UpdatePatientPlanScheduleSchema,
  CreatePatientPlanScheduleLogSchema
} from '../dto/plans.dto';
import { ApiResponse } from '@shared/utils/api-response';
import { StatusCodes } from 'http-status-codes';

// ===================================================================
// 🎯 QUERY FILTER SCHEMAS
// ===================================================================

export const PlanFilterSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  clientId: z.number().int().positive().optional(),
  name: z.string().optional(),
  diagnosisId: z.number().int().positive().optional(),
  sort: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const PatientPlanFilterSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  patientId: z.number().int().positive().optional(),
  planId: z.number().int().positive().optional(),
  surgeonId: z.number().int().positive().optional(),
  locationId: z.number().int().positive().optional(),
  sort: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const PatientPlanScheduleFilterSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  patientPlanId: z.number().int().positive().optional(),
  patientId: z.number().int().positive().optional(),
  scheduleType: z.enum(['Exercise', 'Goal', 'Medication', 'None']).optional(),
  isCompleted: z.boolean().optional(),
  sort: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const PatientPlanScheduleLogFilterSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  scheduleId: z.number().int().positive().optional(),
  patientId: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sort: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ===================================================================
// 🎯 HELPER FUNCTIONS
// ===================================================================

/**
 * Generic validation middleware factory
 */
const createValidator = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.code === 'invalid_type' ? 'Invalid type' : req.body[err.path[0]]
        }));
        
        res.status(StatusCodes.BAD_REQUEST).json(
          ApiResponse.error(
            'Validation failed',
            'VALIDATION_ERROR',
            validationErrors
          )
        );
      }
      
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error(
          'Invalid request data',
          'BAD_REQUEST'
        )
      );
    }
  };
};

/**
 * Query parameter validation middleware factory
 */
const createQueryValidator = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Convert query parameters to proper types
      const queryData: any = { ...req.query };
      
      // Convert string numbers to actual numbers for pagination
      if (queryData.page) queryData.page = Number(queryData.page);
      if (queryData.limit) queryData.limit = Number(queryData.limit);
      if (queryData.clientId) queryData.clientId = Number(queryData.clientId);
      if (queryData.patientId) queryData.patientId = Number(queryData.patientId);
      if (queryData.planId) queryData.planId = Number(queryData.planId);
      if (queryData.diagnosisId) queryData.diagnosisId = Number(queryData.diagnosisId);
      if (queryData.patientPlanId) queryData.patientPlanId = Number(queryData.patientPlanId);
      if (queryData.scheduleId) queryData.scheduleId = Number(queryData.scheduleId);
      if (queryData.surgeonId) queryData.surgeonId = Number(queryData.surgeonId);
      if (queryData.locationId) queryData.locationId = Number(queryData.locationId);
      
      // Convert boolean strings
      if (queryData.isCompleted) queryData.isCompleted = queryData.isCompleted === 'true';
      if (queryData.isActive) queryData.isActive = queryData.isActive === 'true';
      
      const parsed = schema.parse(queryData);
      req.query = parsed as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: req.query[err.path[0] as string]
        }));
        
        res.status(StatusCodes.BAD_REQUEST).json(
          ApiResponse.error(
            'Invalid query parameters',
            'VALIDATION_ERROR',
            validationErrors
          )
        );
      }
      
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error(
          'Invalid query parameters',
          'BAD_REQUEST'
        )
      );
    }
  };
};

/**
 * ID parameter validation middleware
 */
export const validateId = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  
  if (!id || id <= 0) {
    res.status(StatusCodes.BAD_REQUEST).json(
      ApiResponse.error(
        'Invalid ID parameter',
        'VALIDATION_ERROR',
        [{ field: 'id', message: 'ID must be a positive integer', value: req.params.id }]
      )
    );
  }
  
  req.params.id = String(id);
  next();
};

// ===================================================================
// 🎯 PLAN VALIDATORS
// ===================================================================

export const validateCreatePlan = createValidator(CreatePlanSchema);
export const validateUpdatePlan = createValidator(UpdatePlanSchema);
export const validatePlanFilters = createQueryValidator(PlanFilterSchema);

// ===================================================================
// 🎯 PATIENT PLAN VALIDATORS
// ===================================================================

export const validateCreatePatientPlan = createValidator(CreatePatientPlanSchema);
export const validateUpdatePatientPlan = createValidator(UpdatePatientPlanSchema);
export const validatePatientPlanFilters = createQueryValidator(PatientPlanFilterSchema);

// ===================================================================
// 🎯 PATIENT PLAN SCHEDULE VALIDATORS
// ===================================================================

export const validateCreatePatientPlanSchedule = createValidator(CreatePatientPlanScheduleSchema);
export const validateUpdatePatientPlanSchedule = createValidator(UpdatePatientPlanScheduleSchema);
export const validatePatientPlanScheduleFilters = createQueryValidator(PatientPlanScheduleFilterSchema);

// ===================================================================
// 🎯 PATIENT PLAN SCHEDULE LOG VALIDATORS
// ===================================================================

export const validateCreatePatientPlanScheduleLog = createValidator(CreatePatientPlanScheduleLogSchema);
export const validatePatientPlanScheduleLogFilters = createQueryValidator(PatientPlanScheduleLogFilterSchema);
