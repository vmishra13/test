/**
 * DIAGNOSIS VALIDATORS - Zod validation schemas
 * 
 * This file contains all validation schemas for diagnosis master operations.
 * All input validation and data sanitization happens here.
 */

import { z } from 'zod';

// ===================================================================
// 🎯 INPUT VALIDATION SCHEMAS
// ===================================================================

/**
 * Diagnosis ID parameter validation
 */
export const DiagnosisIdSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10)).pipe(
    z.number().int().positive('Diagnosis ID must be a positive integer')
  ),
});

/**
 * Create diagnosis validation
 */
export const createDiagnosisSchema = z.object({
  name: z.string()
    .min(1, 'Diagnosis name is required')
    .max(100, 'Diagnosis name must not exceed 100 characters')
    .trim(),
  bodyArea: z.string()
    .min(1, 'Body area is required')
    .max(100, 'Body area must not exceed 100 characters')
    .trim(),
  groupType: z.string()
    .min(1, 'Group type is required')
    .max(100, 'Group type must not exceed 100 characters')
    .trim(),
  leftICDCode: z.string()
    .max(50, 'Left ICD code must not exceed 50 characters')
    .optional()
    .transform(val => val?.trim() || null),
  rightICDCode: z.string()
    .max(50, 'Right ICD code must not exceed 50 characters')
    .optional()
    .transform(val => val?.trim() || null),
  bilateralICDCode: z.string()
    .max(50, 'Bilateral ICD code must not exceed 50 characters')
    .optional()
    .transform(val => val?.trim() || null),
  noneICDCode: z.string()
    .max(50, 'None ICD code must not exceed 50 characters')
    .optional()
    .transform(val => val?.trim() || null),
});

/**
 * Update diagnosis validation
 */
export const updateDiagnosisSchema = z.object({
  name: z.string()
    .min(1, 'Diagnosis name cannot be empty')
    .max(100, 'Diagnosis name must not exceed 100 characters')
    .trim()
    .optional(),
  bodyArea: z.string()
    .min(1, 'Body area cannot be empty')
    .max(100, 'Body area must not exceed 100 characters')
    .trim()
    .optional(),
  groupType: z.string()
    .min(1, 'Group type cannot be empty')
    .max(100, 'Group type must not exceed 100 characters')
    .trim()
    .optional(),
  leftICDCode: z.string()
    .max(50, 'Left ICD code must not exceed 50 characters')
    .optional()
    .transform(val => val?.trim() || null),
  rightICDCode: z.string()
    .max(50, 'Right ICD code must not exceed 50 characters')
    .optional()
    .transform(val => val?.trim() || null),
  bilateralICDCode: z.string()
    .max(50, 'Bilateral ICD code must not exceed 50 characters')
    .optional()
    .transform(val => val?.trim() || null),
  noneICDCode: z.string()
    .max(50, 'None ICD code must not exceed 50 characters')
    .optional()
    .transform(val => val?.trim() || null),
});

/**
 * Get diagnoses query validation
 */
export const getDiagnosesQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1)
    .refine(val => val >= 1, { message: 'Page must be at least 1' }),
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 20)
    .refine(val => val >= 1 && val <= 100, { 
      message: 'Limit must be between 1 and 100' 
    }),
  search: z.string()
    .optional()
    .transform(val => val?.trim() || undefined),
  bodyArea: z.string()
    .optional()
    .transform(val => val?.trim() || undefined),
  groupType: z.string()
    .optional()
    .transform(val => val?.trim() || undefined),
  sort: z.enum(['asc', 'desc'])
    .optional()
    .default('asc'),
});

// ===================================================================
// 🎯 TYPE EXPORTS
// ===================================================================

export type DiagnosisIdInput = z.infer<typeof DiagnosisIdSchema>;
export type CreateDiagnosisInput = z.infer<typeof createDiagnosisSchema>;
export type UpdateDiagnosisInput = z.infer<typeof updateDiagnosisSchema>;
export type GetDiagnosesQuery = z.infer<typeof getDiagnosesQuerySchema>;
