/**
 * DIAGNOSIS MASTER DTOs - Data Transfer Objects
 * 
 * This file contains all DTOs for diagnosis master operations.
 * DTOs define the structure of data that flows between different layers
 * of the application and ensure type safety.
 */

import { z } from 'zod';

// ===================================================================
// 🎯 CORE DTO SCHEMAS  
// ===================================================================

/**
 * Core Diagnosis schema
 */
export const DiagnosisSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(100).nullable(),
  bodyArea: z.string().max(100),
  groupType: z.string().max(100),
  leftICDCode: z.string().max(50).nullable(),
  rightICDCode: z.string().max(50).nullable(),
  bilateralICDCode: z.string().max(50).nullable(),
  noneICDCode: z.string().max(50).nullable(),
  crUser: z.string().max(50),
  crDate: z.date().nullable(),
  modUser: z.string().max(50),
  modDate: z.date().nullable(),
});

/**
 * Create Diagnosis input schema
 */
export const CreateDiagnosisSchema = z.object({
  name: z.string().min(1, 'Diagnosis name is required').max(100),
  bodyArea: z.string().min(1, 'Body area is required').max(100),
  groupType: z.string().min(1, 'Group type is required').max(100),
  leftICDCode: z.string().max(50).optional(),
  rightICDCode: z.string().max(50).optional(),
  bilateralICDCode: z.string().max(50).optional(),
  noneICDCode: z.string().max(50).optional(),
});

/**
 * Update Diagnosis input schema
 */
export const UpdateDiagnosisSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bodyArea: z.string().min(1).max(100).optional(),
  groupType: z.string().min(1).max(100).optional(),
  leftICDCode: z.string().max(50).optional(),
  rightICDCode: z.string().max(50).optional(),
  bilateralICDCode: z.string().max(50).optional(),
  noneICDCode: z.string().max(50).optional(),
});

/**
 * Query parameters schema for listing diagnoses
 */
export const DiagnosisQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  search: z.string().optional(),
  bodyArea: z.string().optional(),
  groupType: z.string().optional(),
  sort: z.enum(['asc', 'desc']).optional().default('asc'),
});

// ===================================================================
// 🎯 RESPONSE DTOs
// ===================================================================

/**
 * Diagnosis response for API
 */
export const DiagnosisResponseSchema = DiagnosisSchema;

/**
 * Paginated diagnosis response
 */
export const PaginatedDiagnosisResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(DiagnosisResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
  }),
  message: z.string().optional(),
});

// ===================================================================
// 🎯 TYPE EXPORTS
// ===================================================================

export type Diagnosis = z.infer<typeof DiagnosisSchema>;
export type CreateDiagnosisInput = z.infer<typeof CreateDiagnosisSchema>;
export type UpdateDiagnosisInput = z.infer<typeof UpdateDiagnosisSchema>;
export type DiagnosisQuery = z.infer<typeof DiagnosisQuerySchema>;
export type DiagnosisResponse = z.infer<typeof DiagnosisResponseSchema>;
export type PaginatedDiagnosisResponse = z.infer<typeof PaginatedDiagnosisResponseSchema>;

// ===================================================================
// 🎯 HIPAA COMPLIANT PUBLIC RESPONSE
// ===================================================================

/**
 * Public-safe diagnosis response (no sensitive data)
 */
export const PublicDiagnosisSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  bodyArea: z.string(),
  groupType: z.string(),
  leftICDCode: z.string().nullable(),
  rightICDCode: z.string().nullable(),
  bilateralICDCode: z.string().nullable(),
  noneICDCode: z.string().nullable(),
});

export type PublicDiagnosis = z.infer<typeof PublicDiagnosisSchema>;
