/**
 * MEDICATION MASTER DTOs - Data Transfer Objects
 * 
 * This file contains all DTOs for medication master operations.
 * DTOs define the structure of data that flows between different layers
 * of the application and ensure type safety.
 */

import { z } from 'zod';

// ===================================================================
// 🎯 CORE DTO SCHEMAS  
// ===================================================================

/**
 * Core Medication schema
 */
export const MedicationSchema = z.object({
  id: z.string().uuid(),
  medication_name: z.string().max(255),
  generic_name: z.string().max(100).optional(),
  brand_name: z.string().max(100).optional(),
  strength: z.string().max(50).optional(),
  dosage_form: z.string().max(50).optional(),
  route_of_administration: z.string().max(100).optional(),
  manufacturer: z.string().max(255).optional(),
  ndc_number: z.string().max(50).optional(),
  drug_class: z.string().optional(),
  therapeutic_category: z.string().optional(),
  indication: z.string().optional(),
  contraindications: z.string().optional(),
  side_effects: z.string().optional(),
  interactions: z.string().optional(),
  pregnancy_category: z.string().max(50).optional(),
  controlled_substance_schedule: z.string().max(50).optional(),
  approval_status: z.string().max(50).optional(),
  approval_date: z.string().datetime().optional(),
  clientId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().max(50).optional(),
  updatedBy: z.string().max(50).optional(),
});

// ===================================================================
// 🎯 CREATE/UPDATE DTO SCHEMAS
// ===================================================================

/**
 * Create Medication DTO - Used for creating new medications
 */
export const CreateMedicationSchema = z.object({
  medication_name: z.string()
    .min(1, 'Medication name is required')
    .max(255, 'Medication name must be 255 characters or less'),
  
  generic_name: z.string()
    .max(100, 'Generic name must be 100 characters or less')
    .optional(),
  
  brand_name: z.string()
    .max(100, 'Brand name must be 100 characters or less')
    .optional(),
  
  strength: z.string()
    .max(50, 'Strength must be 50 characters or less')
    .optional(),
  
  dosage_form: z.string()
    .max(50, 'Dosage form must be 50 characters or less')
    .optional(),
  
  route_of_administration: z.string()
    .max(100, 'Route of administration must be 100 characters or less')
    .optional(),
  
  manufacturer: z.string()
    .max(255, 'Manufacturer must be 255 characters or less')
    .optional(),
  
  ndc_number: z.string()
    .max(50, 'NDC number must be 50 characters or less')
    .optional(),
  
  drug_class: z.string().optional(),
  therapeutic_category: z.string().optional(),
  indication: z.string().optional(),
  contraindications: z.string().optional(),
  side_effects: z.string().optional(),
  interactions: z.string().optional(),
  
  pregnancy_category: z.string()
    .max(50, 'Pregnancy category must be 50 characters or less')
    .optional(),
  
  controlled_substance_schedule: z.string()
    .max(50, 'Controlled substance schedule must be 50 characters or less')
    .optional(),
  
  approval_status: z.string()
    .max(50, 'Approval status must be 50 characters or less')
    .optional(),
  
  approval_date: z.string().datetime().optional(),
});

/**
 * Update Medication DTO - Used for updating existing medications
 */
export const UpdateMedicationSchema = z.object({
  medication_name: z.string()
    .min(1, 'Medication name cannot be empty')
    .max(255, 'Medication name must be 255 characters or less')
    .optional(),
  
  generic_name: z.string()
    .max(100, 'Generic name must be 100 characters or less')
    .optional(),
  
  brand_name: z.string()
    .max(100, 'Brand name must be 100 characters or less')
    .optional(),
  
  strength: z.string()
    .max(50, 'Strength must be 50 characters or less')
    .optional(),
  
  dosage_form: z.string()
    .max(50, 'Dosage form must be 50 characters or less')
    .optional(),
  
  route_of_administration: z.string()
    .max(100, 'Route of administration must be 100 characters or less')
    .optional(),
  
  manufacturer: z.string()
    .max(255, 'Manufacturer must be 255 characters or less')
    .optional(),
  
  ndc_number: z.string()
    .max(50, 'NDC number must be 50 characters or less')
    .optional(),
  
  drug_class: z.string().optional(),
  therapeutic_category: z.string().optional(),
  indication: z.string().optional(),
  contraindications: z.string().optional(),
  side_effects: z.string().optional(),
  interactions: z.string().optional(),
  
  pregnancy_category: z.string()
    .max(50, 'Pregnancy category must be 50 characters or less')
    .optional(),
  
  controlled_substance_schedule: z.string()
    .max(50, 'Controlled substance schedule must be 50 characters or less')
    .optional(),
  
  approval_status: z.string()
    .max(50, 'Approval status must be 50 characters or less')
    .optional(),
  
  approval_date: z.string().datetime().optional(),
});

// ===================================================================
// 🎯 QUERY DTO SCHEMAS
// ===================================================================

/**
 * Medication Query DTO - Used for filtering and pagination
 */
export const MedicationQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1),
  
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 20),
  
  search: z.string().optional(),
  
  dosage_form: z.string().optional(),
  
  manufacturer: z.string().optional(),
  
  drug_class: z.string().optional(),
  
  therapeutic_category: z.string().optional(),
  
  sort: z.enum(['asc', 'desc'])
    .optional()
    .default('asc'),
  
  sortBy: z.enum(['medication_name', 'generic_name', 'brand_name', 'manufacturer', 'createdAt'])
    .optional()
    .default('medication_name'),
});

// ===================================================================
// 🎯 TYPE EXPORTS
// ===================================================================

export type Medication = z.infer<typeof MedicationSchema>;
export type CreateMedicationInput = z.infer<typeof CreateMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof UpdateMedicationSchema>;
export type MedicationQuery = z.infer<typeof MedicationQuerySchema>;

// ===================================================================
// 🎯 RESPONSE DTO INTERFACES
// ===================================================================

export interface MedicationResponseDTO extends Medication {}

export interface MedicationListResponseDTO {
  medications: MedicationResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
