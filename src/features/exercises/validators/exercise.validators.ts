/**
 * EXERCISE VALIDATORS - Zod validation schemas
 * 
 * This file contains all validation schemas for exercise master operations.
 * All input validation and data sanitization happens here.
 */

import { z } from 'zod';

// ===================================================================
// 🎯 INPUT VALIDATION SCHEMAS
// ===================================================================

/**
 * Exercise ID parameter validation
 */
export const ExerciseIdSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10)).pipe(
    z.number().int().positive('Exercise ID must be a positive integer')
  ),
});

/**
 * Exercise query parameters validation
 */
export const ExerciseParamsSchema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1)
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 20)
    .pipe(z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100')),
  
  search: z.string()
    .min(1, 'Search term cannot be empty')
    .max(255, 'Search term too long')
    .optional(),
  
  media_type: z.enum(['video', 'image', 'audio', 'document'], {
    errorMap: () => ({ message: 'Invalid media type' })
  }).optional(),
  
  frequencyPeriod: z.enum(['Day', 'Week', 'Month'], {
    errorMap: () => ({ message: 'Invalid frequency period' })
  }).optional(),
  
  unit: z.enum(['Set', 'Rep', 'Time', 'Distance'], {
    errorMap: () => ({ message: 'Invalid unit type' })
  }).optional(),
  
  sort: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Sort must be either "asc" or "desc"' })
  }).optional().default('asc'),
  
  sortBy: z.enum(['title', 'purpose', 'crDate'], {
    errorMap: () => ({ message: 'Invalid sort field' })
  }).optional().default('title'),
});

/**
 * Bulk operation validation
 */
export const BulkExerciseIdsSchema = z.object({
  ids: z.array(z.number().int().positive('Invalid exercise ID'))
    .min(1, 'At least one exercise ID is required')
    .max(100, 'Cannot process more than 100 exercises at once'),
});

// ===================================================================
// 🎯 TYPE EXPORTS
// ===================================================================

export type ExerciseIdInput = z.infer<typeof ExerciseIdSchema>;
export type ExerciseParamsInput = z.infer<typeof ExerciseParamsSchema>;
export type BulkExerciseIdsInput = z.infer<typeof BulkExerciseIdsSchema>;
