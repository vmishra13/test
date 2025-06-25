/**
 * FORM MASTER VALIDATORS - Zod Schema Validation
 * 
 * This file contains all validation schemas for form master operations.
 * Validators ensure data integrity, security, and HIPAA compliance.
 * 
 * Features:
 * - Input sanitization and validation
 * - Healthcare-specific validation rules
 * - Multi-tenant security validation
 * - PII/PHI protection
 */

import { z } from 'zod';
import { Request } from 'express';

// ===================================================================
// 🎯 BASE VALIDATION SCHEMAS
// ===================================================================

/**
 * Form ID validation
 */
export const formIdSchema = z.number().int().positive('Form ID must be a positive integer');

/**
 * Client ID validation
 */
export const clientIdSchema = z.number().int().positive('Client ID must be a positive integer');

/**
 * User validation
 */
export const userSchema = z.string().max(50, 'User must be 50 characters or less').min(1, 'User is required');

// ===================================================================
// 🎯 FORM FIELD VALIDATION SCHEMAS
// ===================================================================

/**
 * Form name validation with healthcare compliance
 */
export const formNameSchema = z.string()
  .min(1, 'Form name is required')
  .max(255, 'Form name must be 255 characters or less')
  .trim()
  .refine(name => {
    // Check for potentially sensitive information in form names
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b\d{10,}\b/, // Long numbers (potential MRNs)
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b(password|ssn|social|credit|card)\b/i, // Sensitive keywords
    ];
    return !sensitivePatterns.some(pattern => pattern.test(name));
  }, 'Form name contains potentially sensitive information')
  .refine(name => {
    // Only allow safe characters
    return /^[a-zA-Z0-9\s\-_\.(),&]+$/.test(name);
  }, 'Form name contains invalid characters');

/**
 * Form description validation
 */
export const formDescriptionSchema = z.string()
  .max(1000, 'Description must be 1000 characters or less')
  .trim()
  .optional()
  .nullable();

/**
 * Form type validation for healthcare contexts
 */
export const formTypeSchema = z.enum([
  'INTAKE',            // Patient intake forms
  'ASSESSMENT',        // Clinical assessments
  'TREATMENT_PLAN',    // Treatment planning forms
  'PROGRESS_NOTE',     // Progress documentation
  'DISCHARGE_SUMMARY', // Discharge planning
  'CONSENT',           // Consent forms
  'SCREENING',         // Health screenings
  'EVALUATION',        // Clinical evaluations
  'FOLLOW_UP',         // Follow-up questionnaires
  'INSURANCE',         // Insurance-related forms
  'MEDICATION',        // Medication management
  'THERAPY',           // Therapy-specific forms
  'CUSTOM'             // Custom organizational forms
]);

/**
 * Form status validation
 */
export const formStatusSchema = z.enum([
  'DRAFT',      // Form under development
  'ACTIVE',     // Form available for use
  'INACTIVE',   // Temporarily disabled
  'ARCHIVED',   // Permanently archived
  'DEPRECATED'  // Replaced by newer version
]);

// ===================================================================
// 🎯 FORM STRUCTURE VALIDATION
// ===================================================================

/**
 * Form field validation schema
 */
export const formFieldSchema = z.object({
  id: z.string().min(1, 'Field ID is required'),
  type: z.enum([
    'text', 'textarea', 'number', 'date', 'datetime', 
    'select', 'radio', 'checkbox', 'file', 'email', 
    'phone', 'url', 'password', 'hidden'
  ]),
  label: z.string().min(1, 'Field label is required').max(200),
  placeholder: z.string().max(200).optional(),
  required: z.boolean().default(false),
  readonly: z.boolean().default(false),
  description: z.string().max(500).optional(),
  
  // Validation rules
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    customMessage: z.string().optional(),
  }).optional(),
  
  // Options for select/radio/checkbox fields
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    disabled: z.boolean().default(false),
  })).optional(),
  
  // Conditional logic
  conditionalLogic: z.object({
    dependsOn: z.string().optional(),
    condition: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']).optional(),
    value: z.string().optional(),
  }).optional(),
});

/**
 * Form section validation schema
 */
export const formSectionSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  title: z.string().min(1, 'Section title is required').max(200),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0).default(0),
  collapsible: z.boolean().default(false),
  defaultCollapsed: z.boolean().default(false),
  fields: z.array(formFieldSchema).min(1, 'Section must have at least one field'),
});

/**
 * Complete form schema validation
 */
export const formSchemaValidator = z.object({
  version: z.string().default('1.0'),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  sections: z.array(formSectionSchema).min(1, 'Form must have at least one section'),
  
  // Form-level settings
  settings: z.object({
    allowSave: z.boolean().default(true),
    allowPrint: z.boolean().default(true),
    requireSignature: z.boolean().default(false),
    multiPage: z.boolean().default(false),
    showProgress: z.boolean().default(true),
    autoSave: z.boolean().default(false),
    theme: z.string().optional(),
  }).optional(),
  
  // Security settings
  security: z.object({
    encryptData: z.boolean().default(true),
    auditTrail: z.boolean().default(true),
    accessControl: z.array(z.string()).optional(),
    retentionPeriod: z.number().optional(), // days
  }).optional(),
});

// ===================================================================
// 🎯 REQUEST VALIDATION SCHEMAS
// ===================================================================

/**
 * Create Form Request validation
 */
export const createFormRequestSchema = z.object({
  body: z.object({
    name: formNameSchema,
    description: formDescriptionSchema,
    formType: formTypeSchema.optional(),
    status: formStatusSchema.default('DRAFT'),
    formSchema: formSchemaValidator.optional(),
    
    // Metadata
    metadata: z.object({
      category: z.string().max(100).optional(),
      tags: z.array(z.string().max(50)).max(10).optional(),
      estimatedTime: z.number().int().min(1).max(300).optional(), // 1-300 minutes
      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
      requiredRoles: z.array(z.string().max(50)).max(20).optional(),
      version: z.string().max(20).default('1.0'),
    }).optional(),
    
    // Healthcare-specific metadata
    healthcareMetadata: z.object({
      clinicalDomain: z.enum([
        'CARDIOLOGY', 'ORTHOPEDICS', 'NEUROLOGY', 'ONCOLOGY',
        'PEDIATRICS', 'GERIATRICS', 'PSYCHIATRY', 'GENERAL',
        'EMERGENCY', 'SURGERY', 'RADIOLOGY', 'PATHOLOGY'
      ]).optional(),
      icdCodes: z.array(z.string().max(10)).optional(),
      cptCodes: z.array(z.string().max(10)).optional(),
      regulatoryCompliance: z.array(z.enum([
        'HIPAA', 'FDA', 'CMS', 'JOINT_COMMISSION', 'STATE_SPECIFIC'
      ])).optional(),
    }).optional(),
  }),
});

/**
 * Update Form Request validation
 */
export const updateFormRequestSchema = z.object({
  params: z.object({
    id: formIdSchema,
  }),
  body: createFormRequestSchema.shape.body.partial(),
});

/**
 * Get Form Request validation
 */
export const getFormRequestSchema = z.object({
  params: z.object({
    id: formIdSchema,
  }),
});

/**
 * Delete Form Request validation
 */
export const deleteFormRequestSchema = z.object({
  params: z.object({
    id: formIdSchema,
  }),
});

/**
 * Form Query Request validation
 */
export const formQueryRequestSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
    formType: formTypeSchema.optional(),
    status: formStatusSchema.optional(),
    category: z.string().max(50).optional(),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'formType', 'status']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    
    // Date filters
    createdFrom: z.string().datetime().optional(),
    createdTo: z.string().datetime().optional(),
    updatedFrom: z.string().datetime().optional(),
    updatedTo: z.string().datetime().optional(),
    
    // Healthcare-specific filters
    clinicalDomain: z.enum([
      'CARDIOLOGY', 'ORTHOPEDICS', 'NEUROLOGY', 'ONCOLOGY',
      'PEDIATRICS', 'GERIATRICS', 'PSYCHIATRY', 'GENERAL',
      'EMERGENCY', 'SURGERY', 'RADIOLOGY', 'PATHOLOGY'
    ]).optional(),
    
    // Boolean filters
    isActive: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
    requiresSignature: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  }),
});

// ===================================================================
// 🎯 MIDDLEWARE VALIDATION FUNCTIONS
// ===================================================================

/**
 * Validate create form request
 */
export const validateCreateFormRequest = (req: Request): z.infer<typeof createFormRequestSchema> => {
  return createFormRequestSchema.parse(req);
};

/**
 * Validate update form request
 */
export const validateUpdateFormRequest = (req: Request): z.infer<typeof updateFormRequestSchema> => {
  return updateFormRequestSchema.parse(req);
};

/**
 * Validate get form request
 */
export const validateGetFormRequest = (req: Request): z.infer<typeof getFormRequestSchema> => {
  return getFormRequestSchema.parse(req);
};

/**
 * Validate delete form request
 */
export const validateDeleteFormRequest = (req: Request): z.infer<typeof deleteFormRequestSchema> => {
  return deleteFormRequestSchema.parse(req);
};

/**
 * Validate form query request
 */
export const validateFormQueryRequest = (req: Request): z.infer<typeof formQueryRequestSchema> => {
  return formQueryRequestSchema.parse(req);
};

// ===================================================================
// 🎯 CUSTOM VALIDATION FUNCTIONS
// ===================================================================

/**
 * Validate form schema structure for security and healthcare compliance
 */
export const validateFormSchemaStructure = (formSchema: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    if (!formSchema || typeof formSchema !== 'object') {
      errors.push('Form schema must be a valid object');
      return { isValid: false, errors };
    }
    
    if (!formSchema.sections || !Array.isArray(formSchema.sections)) {
      errors.push('Form schema must contain a sections array');
      return { isValid: false, errors };
    }
    
    if (formSchema.sections.length === 0) {
      errors.push('Form must have at least one section');
      return { isValid: false, errors };
    }
    
    // Validate each section
    formSchema.sections.forEach((section: any, sectionIndex: number) => {
      if (!section.id || typeof section.id !== 'string') {
        errors.push(`Section ${sectionIndex + 1}: ID is required and must be a string`);
      }
      
      if (!section.title || typeof section.title !== 'string') {
        errors.push(`Section ${sectionIndex + 1}: Title is required and must be a string`);
      }
      
      if (!section.fields || !Array.isArray(section.fields)) {
        errors.push(`Section ${sectionIndex + 1}: Must contain a fields array`);
        return;
      }
      
      if (section.fields.length === 0) {
        errors.push(`Section ${sectionIndex + 1}: Must have at least one field`);
      }
      
      // Validate each field
      section.fields.forEach((field: any, fieldIndex: number) => {
        const fieldPath = `Section ${sectionIndex + 1}, Field ${fieldIndex + 1}`;
        
        if (!field.id || typeof field.id !== 'string') {
          errors.push(`${fieldPath}: ID is required and must be a string`);
        }
        
        if (!field.type || typeof field.type !== 'string') {
          errors.push(`${fieldPath}: Type is required and must be a string`);
        }
        
        if (!field.label || typeof field.label !== 'string') {
          errors.push(`${fieldPath}: Label is required and must be a string`);
        }
        
        // Check for potentially dangerous field types or patterns
        if (field.type === 'script' || field.type === 'html') {
          errors.push(`${fieldPath}: Field type '${field.type}' is not allowed for security reasons`);
        }
        
        // Validate field ID uniqueness within form
        const allFieldIds = formSchema.sections.flatMap((s: any) => s.fields.map((f: any) => f.id));
        const duplicateIds = allFieldIds.filter((id: string, index: number) => allFieldIds.indexOf(id) !== index);
        if (duplicateIds.includes(field.id)) {
          errors.push(`${fieldPath}: Field ID '${field.id}' must be unique within the form`);
        }
      });
    });
    
    return { isValid: errors.length === 0, errors };
    
  } catch (error) {
    errors.push('Invalid form schema structure');
    return { isValid: false, errors };
  }
};

/**
 * Validate that form data doesn't contain PII/PHI
 */
export const validateNoPII = (data: any): { isValid: boolean; violations: string[] } => {
  const violations: string[] = [];
  const dataString = JSON.stringify(data).toLowerCase();
  
  // PII/PHI patterns to check for
  const piiPatterns = [
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/, description: 'Social Security Number pattern' },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, description: 'Email address' },
    { pattern: /\b\d{3}-\d{3}-\d{4}\b/, description: 'Phone number pattern' },
    { pattern: /\b\d{16}\b/, description: 'Credit card number pattern' },
    { pattern: /\b(password|ssn|social|credit|card|pin)\b/i, description: 'Sensitive keywords' },
  ];
  
  piiPatterns.forEach(({ pattern, description }) => {
    if (pattern.test(dataString)) {
      violations.push(description);
    }
  });
  
  return { isValid: violations.length === 0, violations };
};

// ===================================================================
// 🎯 TYPE EXPORTS
// ===================================================================

export type CreateFormRequest = z.infer<typeof createFormRequestSchema>;
export type UpdateFormRequest = z.infer<typeof updateFormRequestSchema>;
export type GetFormRequest = z.infer<typeof getFormRequestSchema>;
export type DeleteFormRequest = z.infer<typeof deleteFormRequestSchema>;
export type FormQueryRequest = z.infer<typeof formQueryRequestSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export type FormSection = z.infer<typeof formSectionSchema>;
export type FormSchemaStructure = z.infer<typeof formSchemaValidator>;
