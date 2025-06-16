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
