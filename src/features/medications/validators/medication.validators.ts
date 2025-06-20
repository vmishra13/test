/**
 * MEDICATION VALIDATORS - Zod validation schemas
 * 
 * This file contains all validation schemas for medication master operations.
 * All input validation and data sanitization happens here.
 */

import { z } from 'zod';

// ===================================================================
// 🎯 INPUT VALIDATION SCHEMAS
// ===================================================================

/**
 * Medication ID parameter validation
 */
export const MedicationIdSchema = z.object({
  id: z.string().uuid('Invalid medication ID format'),
});

/**
 * Medication query parameters validation
 */
export const MedicationParamsSchema = z.object({
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
  
  dosage_form: z.string()
    .max(50, 'Dosage form filter too long')
    .optional(),
  
  manufacturer: z.string()
    .max(255, 'Manufacturer filter too long')
    .optional(),
  
  drug_class: z.string()
    .max(100, 'Drug class filter too long')
    .optional(),
  
  therapeutic_category: z.string()
    .max(100, 'Therapeutic category filter too long')
    .optional(),
  
  sort: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Sort must be either "asc" or "desc"' })
  }).optional().default('asc'),
  
  sortBy: z.enum(['medication_name', 'generic_name', 'brand_name', 'manufacturer', 'createdAt'], {
    errorMap: () => ({ message: 'Invalid sort field' })
  }).optional().default('medication_name'),
});

/**
 * Bulk operation validation
 */
export const BulkMedicationIdsSchema = z.object({
  ids: z.array(z.string().uuid('Invalid medication ID format'))
    .min(1, 'At least one medication ID is required')
    .max(100, 'Cannot process more than 100 medications at once'),
});

// ===================================================================
// 🎯 TYPE EXPORTS
// ===================================================================

export type MedicationIdInput = z.infer<typeof MedicationIdSchema>;
export type MedicationParamsInput = z.infer<typeof MedicationParamsSchema>;
export type BulkMedicationIdsInput = z.infer<typeof BulkMedicationIdsSchema>;
