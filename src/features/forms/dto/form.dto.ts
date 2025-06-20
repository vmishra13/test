/**
 * FORM MASTER DTOs - Data Transfer Objects
 * 
 * This file contains all DTOs for form master operations.
 * DTOs define the structure of data that flows between different layers
 * of the application and ensure type safety.
 * 
 * Features:
 * - Multi-tenant security with clientId isolation
 * - HIPAA compliant data validation
 * - Healthcare-specific form management
 */

import { z } from 'zod';

// ===================================================================
// 🎯 CORE DTO SCHEMAS  
// ===================================================================

/**
 * Core Form schema matching Prisma model
 */
export const FormSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(255),
  description: z.string().nullable(),
  clientid: z.number().int().positive().nullable().default(1),
  cruser: z.string().max(50),
  crdate: z.date().nullable(),
  moduser: z.string().max(50),
  moddate: z.date().nullable(),
});

// ===================================================================
// 🎯 CREATE/UPDATE DTO SCHEMAS
// ===================================================================

/**
 * Create Form DTO - Used for creating new forms
 */
export const CreateFormSchema = z.object({
  name: z.string()
    .min(1, 'Form name is required')
    .max(255, 'Form name must be 255 characters or less')
    .trim()
    .refine(name => /^[a-zA-Z0-9\s\-_\.(),]+$/.test(name), {
      message: 'Form name contains invalid characters'
    }),
  
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .trim()
    .optional()
    .nullable(),
  
  // Healthcare-specific fields
  formType: z.enum([
    'INTAKE',
    'ASSESSMENT', 
    'TREATMENT_PLAN',
    'PROGRESS_NOTE',
    'DISCHARGE_SUMMARY',
    'CONSENT',
    'SCREENING',
    'EVALUATION',
    'CUSTOM'
  ]).optional(),
  
  isActive: z.boolean().default(true),
  
  // Form structure (JSON schema for dynamic forms)
  formSchema: z.object({
    version: z.string().default('1.0'),
    sections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      fields: z.array(z.object({
        id: z.string(),
        type: z.enum(['text', 'textarea', 'number', 'date', 'select', 'radio', 'checkbox', 'file']),
        label: z.string(),
        required: z.boolean().default(false),
        placeholder: z.string().optional(),
        validation: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
          pattern: z.string().optional(),
          message: z.string().optional(),
        }).optional(),
        options: z.array(z.object({
          value: z.string(),
          label: z.string(),
        })).optional(),
      })),
    })),
  }).optional(),
  
  // Metadata
  metadata: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    estimatedTime: z.number().optional(), // in minutes
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    requiredRoles: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * Update Form DTO - Used for updating existing forms
 */
export const UpdateFormSchema = CreateFormSchema.partial().omit({
  // Cannot change client during update
});

/**
 * Form Query DTO - Used for filtering and searching forms
 */
export const FormQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().max(100).optional(),
  formType: z.enum([
    'INTAKE',
    'ASSESSMENT', 
    'TREATMENT_PLAN',
    'PROGRESS_NOTE',
    'DISCHARGE_SUMMARY',
    'CONSENT',
    'SCREENING',
    'EVALUATION',
    'CUSTOM'
  ]).optional(),
  isActive: z.boolean().optional(),
  category: z.string().max(50).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'formType']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  // Date range filters
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
});

// ===================================================================
// 🎯 RESPONSE DTOs
// ===================================================================

/**
 * Form Response DTO - Used for API responses
 */
export const FormResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  formType: z.string().optional(),
  isActive: z.boolean(),
  formSchema: z.any().optional(), // JSON object
  metadata: z.any().optional(), // JSON object
  clientId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
  // Additional computed fields
  fieldCount: z.number().optional(),
  lastUsed: z.date().optional(),
  usageCount: z.number().optional(),
});

/**
 * Form List Response DTO - Used for paginated form lists
 */
export const FormListResponseSchema = z.object({
  forms: z.array(FormResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
  filters: z.object({
    search: z.string().optional(),
    formType: z.string().optional(),
    category: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * Form Summary DTO - Used for dashboard and quick overviews
 */
export const FormSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  formType: z.string().optional(),
  isActive: z.boolean(),
  fieldCount: z.number(),
  lastModified: z.date(),
  createdBy: z.string(),
});

// ===================================================================
// 🎯 TYPESCRIPT TYPES (INFERRED FROM SCHEMAS)
// ===================================================================

export type CreateFormDto = z.infer<typeof CreateFormSchema>;
export type UpdateFormDto = z.infer<typeof UpdateFormSchema>;
export type FormQueryDto = z.infer<typeof FormQuerySchema>;
export type FormResponseDto = z.infer<typeof FormResponseSchema>;
export type FormListResponseDto = z.infer<typeof FormListResponseSchema>;
export type FormSummaryDto = z.infer<typeof FormSummarySchema>;
export type FormDto = z.infer<typeof FormSchema>;

// ===================================================================
// 🎯 VALIDATION HELPERS
// ===================================================================

/**
 * Validate create form data
 */
export const validateCreateForm = (data: unknown): CreateFormDto => {
  return CreateFormSchema.parse(data);
};

/**
 * Validate update form data
 */
export const validateUpdateForm = (data: unknown): UpdateFormDto => {
  return UpdateFormSchema.parse(data);
};

/**
 * Validate form query parameters
 */
export const validateFormQuery = (data: unknown): FormQueryDto => {
  return FormQuerySchema.parse(data);
};

// ===================================================================
// 🎯 HEALTHCARE-SPECIFIC VALIDATORS
// ===================================================================

/**
 * Validate form name for healthcare compliance
 */
export const validateHealthcareFormName = (name: string): boolean => {
  // Check for PII patterns that shouldn't be in form names
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
    /\b\d{10,}\b/, // Long numbers that might be MRNs
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
  ];
  
  return !piiPatterns.some(pattern => pattern.test(name));
};

/**
 * Validate form schema for security
 */
export const validateFormSchemaStructure = (schema: any): boolean => {
  try {
    // Basic structure validation
    if (!schema || typeof schema !== 'object') return false;
    if (!schema.sections || !Array.isArray(schema.sections)) return false;
    
    // Validate sections
    for (const section of schema.sections) {
      if (!section.id || !section.title || !section.fields) return false;
      if (!Array.isArray(section.fields)) return false;
      
      // Validate fields
      for (const field of section.fields) {
        if (!field.id || !field.type || !field.label) return false;
        
        // Check for potentially dangerous field types
        const allowedTypes = ['text', 'textarea', 'number', 'date', 'select', 'radio', 'checkbox', 'file'];
        if (!allowedTypes.includes(field.type)) return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// ===================================================================
// 🎯 ERROR TYPES
// ===================================================================

export class FormValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'FormValidationError';
  }
}

export class FormNotFoundError extends Error {
  constructor(formId: number) {
    super(`Form with ID ${formId} not found`);
    this.name = 'FormNotFoundError';
  }
}

export class FormAccessError extends Error {
  constructor(message: string = 'Access denied to form') {
    super(message);
    this.name = 'FormAccessError';
  }
}
