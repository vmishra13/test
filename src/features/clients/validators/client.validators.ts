import { z } from 'zod';

/**
 * Client extraInfo Zod schema
 */
export const clientExtraInfoSchema = z.object({
  branding: z.object({
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
    fontFamily: z.string().optional()
  }).optional(),
  
  settings: z.object({
    allowRegistration: z.boolean().optional(),
    requireEmailVerification: z.boolean().optional(),
    sessionTimeout: z.number().min(5).max(1440).optional(), // 5 min to 24 hours
    maxFileSize: z.number().min(1).max(100).optional() // MB
  }).optional(),
  
  integrations: z.object({
    stripe: z.object({
      publishableKey: z.string().optional(),
      webhookSecret: z.string().optional()
    }).optional(),
    sendgrid: z.object({
      apiKey: z.string().optional(),
      fromEmail: z.string().email().optional()
    }).optional()
  }).optional(),
  
  compliance: z.object({
    hipaaEnabled: z.boolean().optional(),
    gdprEnabled: z.boolean().optional(),
    dataRetentionDays: z.number().min(30).max(2555).optional() // 30 days to 7 years
  }).optional(),
  
  custom: z.record(z.string(), z.any()).optional()
}).optional();

// ✅ Infer TypeScript types from Zod schemas
export type ClientExtraInfo = z.infer<typeof clientExtraInfoSchema>;

/**
 * Validate and sanitize JSON field using Zod
 */
export function validateJsonField<T>(
  data: any,
  schema: z.ZodSchema<T>,
  fieldName: string = 'extraInfo'
): { success: true; data: T } | { success: false; errors: string[] } {
  if (data === null || data === undefined) {
    const result = schema.safeParse(undefined);
    return result.success 
      ? { success: true, data: result.data }
      : { success: false, errors: result.error.errors.map(e => `${fieldName}: ${e.message}`) };
  }

  // Handle string JSON
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (error) {
      return {
        success: false,
        errors: [`${fieldName} must be valid JSON`]
      };
    }
  }

  // Validate with Zod
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(e => `${fieldName}.${e.path.join('.')}: ${e.message}`)
    };
  }

  return {
    success: true,
    data: result.data
  };
}

/**
 * Merge JSON fields safely
 */
export function mergeJsonFields<T>(existing: T | null, updates: Partial<T> | null): T | null {
  if (!existing && !updates) return null;
  if (!existing) return updates as T;
  if (!updates) return existing;

  // Deep merge for nested objects
  const merge = (target: any, source: any): any => {
    if (!target || !source) return source || target;
    
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = merge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  };

  return merge(existing, updates);
}

/**
 * Create Client validation schema
 */
export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(255, 'Client name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  timeZone: z.string().max(50, 'Time zone too long').optional(),
  language: z.string().max(10, 'Language code too long').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  logo: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  favIcon: z.string().url('Invalid favicon URL').optional().or(z.literal('')),
  extraInfo: clientExtraInfoSchema.optional()
});

/**
 * Update Client validation schema
 */
export const updateClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(255, 'Client name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  timeZone: z.string().max(50, 'Time zone too long').optional(),
  language: z.string().max(10, 'Language code too long').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  logo: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  favIcon: z.string().url('Invalid favicon URL').optional().or(z.literal('')),
  status: z.number().int().min(0).max(2).optional(),
  extraInfo: clientExtraInfoSchema.optional()
});

/**
 * Get Clients Query validation schema
 */
export const getClientsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  search: z.string().optional(),
  status: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  sort: z.enum(['asc', 'desc']).optional().default('asc')
});
