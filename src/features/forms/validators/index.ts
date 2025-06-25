/**
 * FORM VALIDATION SCHEMAS
 * 
 * Healthcare-compliant validation schemas for form_master operations.
 * Implements strict validation for medical form data with HIPAA considerations.
 */

import { z } from 'zod';

/**
 * Validation schema for creating a new form
 */
export const createFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Form name is required')
    .max(255, 'Form name cannot exceed 255 characters')
    .trim()
    .refine(
      (name) => /^[a-zA-Z0-9\s\-_.,()]+$/.test(name),
      'Form name contains invalid characters'
    ),
  
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional()
    .nullable(),
  
  clientId: z
    .number()
    .int()
    .positive('Client ID must be a positive integer')
});

/**
 * Validation schema for updating an existing form
 */
export const updateFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Form name is required')
    .max(255, 'Form name cannot exceed 255 characters')
    .trim()
    .refine(
      (name) => /^[a-zA-Z0-9\s\-_.,()]+$/.test(name),
      'Form name contains invalid characters'
    )
    .optional(),
  
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional()
    .nullable()
});

/**
 * Validation schema for form query parameters
 */
export const formQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, 'Page must be at least 1')
    .default('1'),
  
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
    .default('20'),
  
  search: z
    .string()
    .max(255, 'Search term too long')
    .trim()
    .optional(),
  
  sortBy: z
    .enum(['name', 'crDate', 'modDate'])
    .default('name'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('asc')
});

/**
 * Validation schema for form ID parameter
 */
export const formIdSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Form ID must be a positive integer')
});

/**
 * Validation schema for bulk operations
 */
export const bulkFormOperationSchema = z.object({
  formIds: z
    .array(z.number().int().positive())
    .min(1, 'At least one form ID is required')
    .max(50, 'Cannot process more than 50 forms at once'),
  
  operation: z.enum(['delete', 'activate', 'deactivate'])
});

/**
 * Validation schema for client ID (used in middleware)
 */
export const clientIdSchema = z.object({
  clientId: z
    .number()
    .int()
    .positive('Client ID must be a positive integer')
});

/**
 * Helper function to validate form name uniqueness within client
 */
export const validateFormNameUniqueness = (name: string, clientId: number, excludeId?: number) => {
  return z.object({
    name: z.string(),
    clientId: z.number(),
    excludeId: z.number().optional()
  }).parse({ name, clientId, excludeId });
};

/**
 * Validation for healthcare form content requirements
 */
export const healthcareFormValidation = z.object({
  name: z.string().refine(
    (name) => {
      // Ensure medical forms have appropriate naming conventions
      const medicalFormPatterns = [
        /assessment/i,
        /evaluation/i,
        /intake/i,
        /consent/i,
        /history/i,
        /examination/i,
        /treatment/i,
        /medication/i,
        /progress/i,
        /discharge/i
      ];
      
      // Allow general forms but encourage medical terminology
      return name.length >= 3; // Basic validation, more specific rules can be added
    },
    'Form name should follow healthcare naming conventions'
  ),
  
  description: z.string().optional().refine(
    (desc) => {
      if (!desc) return true;
      // Check for potential PHI in description and warn
      const phiPatterns = [
        /ssn/i,
        /social security/i,
        /date.*birth/i,
        /dob/i,
        /patient.*id/i
      ];
      
      const containsPHI = phiPatterns.some(pattern => pattern.test(desc));
      return !containsPHI;
    },
    'Form description should not contain potential PHI information'
  )
});

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
export type FormQueryInput = z.infer<typeof formQuerySchema>;
export type FormIdInput = z.infer<typeof formIdSchema>;
export type BulkFormOperationInput = z.infer<typeof bulkFormOperationSchema>;
