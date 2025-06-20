/**
 * PLANS DTOs - Data Transfer Objects
 * 
 * This file contains all DTOs for plan-related operations including:
 * - plan (treatment plans)
 * - patient_plan 
 * - patient_plan_schedule
 * - patient_plan_schedule_log
 */

import { z } from 'zod';

// ===================================================================
// 🎯 ENUMS AND SHARED SCHEMAS
// ===================================================================

export const LiteralityEnum = z.enum(['None', 'Left', 'Right', 'Bilateral']);
export const ScheduleTypeEnum = z.enum(['Exercise', 'Goal', 'Medication', 'None']);
export const FrequencyUnitEnum = z.enum(['Day', 'Week']); // Match Prisma frequency_unit_type
export const MeasurementUnitEnum = z.enum(['Count', 'Steps']); // Match Prisma measurement_unit_type

// ===================================================================
// 🎯 PLAN (TREATMENT PLAN) SCHEMAS
// ===================================================================

/**
 * Core Plan schema
 */
export const PlanSchema = z.object({
  id: z.number().int().positive(),
  clientId: z.number().int().positive(),
  name: z.string().max(100),
  description: z.string().optional(),
  diagnosisId: z.number().int().positive(),
  diagnosisName: z.string().max(100),
  version: z.number().int().optional(),
  model: z.any().optional(), // JSON field
  crUser: z.string().max(50),
  crDate: z.date().optional(),
  modUser: z.string().max(50),
  modDate: z.date().optional(),
});

/**
 * Create Plan DTO
 */
export const CreatePlanSchema = z.object({
  name: z.string()
    .min(1, 'Plan name is required')
    .max(100, 'Plan name must be 100 characters or less'),
  
  description: z.string().optional(),
  
  diagnosisId: z.number()
    .int('Diagnosis ID must be an integer')
    .positive('Diagnosis ID must be positive'),
  
  diagnosisName: z.string()
    .min(1, 'Diagnosis name is required')
    .max(100, 'Diagnosis name must be 100 characters or less'),
  
  version: z.number()
    .int('Version must be an integer')
    .min(1, 'Version must be at least 1')
    .optional()
    .default(1),
  
  model: z.any().optional(), // JSON field for plan structure
});

/**
 * Update Plan DTO
 */
export const UpdatePlanSchema = z.object({
  name: z.string()
    .min(1, 'Plan name cannot be empty')
    .max(100, 'Plan name must be 100 characters or less')
    .optional(),
  
  description: z.string().optional(),
  
  diagnosisId: z.number()
    .int('Diagnosis ID must be an integer')
    .positive('Diagnosis ID must be positive')
    .optional(),
  
  diagnosisName: z.string()
    .min(1, 'Diagnosis name cannot be empty')
    .max(100, 'Diagnosis name must be 100 characters or less')
    .optional(),
  
  version: z.number()
    .int('Version must be an integer')
    .min(1, 'Version must be at least 1')
    .optional(),
  
  model: z.any().optional(),
});

// ===================================================================
// 🎯 PATIENT PLAN SCHEMAS
// ===================================================================

/**
 * Core Patient Plan schema
 */
export const PatientPlanSchema = z.object({
  id: z.number().int().positive(),
  patientId: z.number().int().positive(),
  clientId: z.number().int().optional(),
  locationId: z.number().int().optional(),
  planId: z.number().int().optional(),
  surgeonId: z.number().int().positive(),
  diagnosisId: z.number().int().optional(),
  diagnosisName: z.string().max(100).optional(),
  description: z.string().optional(),
  surgeryDate: z.string().datetime(),
  surgeryTime: z.string().datetime(),
  literality: LiteralityEnum.optional(),
  model: z.any().optional(),
  crUser: z.string().max(50).optional(),
  crDate: z.date().optional(),
  modUser: z.string().max(50),
  modDate: z.date().optional(),
});

/**
 * Create Patient Plan DTO
 */
export const CreatePatientPlanSchema = z.object({
  patientId: z.number()
    .int('Patient ID must be an integer')
    .positive('Patient ID must be positive'),
  
  locationId: z.number()
    .int('Location ID must be an integer')
    .positive('Location ID must be positive')
    .optional(),
  
  planId: z.number()
    .int('Plan ID must be an integer')
    .positive('Plan ID must be positive')
    .optional(),
  
  surgeonId: z.number()
    .int('Surgeon ID must be an integer')
    .positive('Surgeon ID must be positive'),
  
  diagnosisId: z.number()
    .int('Diagnosis ID must be an integer')
    .positive('Diagnosis ID must be positive')
    .optional(),
  
  diagnosisName: z.string()
    .max(100, 'Diagnosis name must be 100 characters or less')
    .optional(),
  
  description: z.string().optional(),
  
  surgeryDate: z.string()
    .datetime('Surgery date must be a valid date'),
  
  surgeryTime: z.string()
    .datetime('Surgery time must be a valid time'),
  
  literality: LiteralityEnum.optional(),
  
  model: z.any().optional(),
});

/**
 * Update Patient Plan DTO
 */
export const UpdatePatientPlanSchema = z.object({
  locationId: z.number()
    .int('Location ID must be an integer')
    .positive('Location ID must be positive')
    .optional(),
  
  planId: z.number()
    .int('Plan ID must be an integer')
    .positive('Plan ID must be positive')
    .optional(),
  
  surgeonId: z.number()
    .int('Surgeon ID must be an integer')
    .positive('Surgeon ID must be positive')
    .optional(),
  
  diagnosisId: z.number()
    .int('Diagnosis ID must be an integer')
    .positive('Diagnosis ID must be positive')
    .optional(),
  
  diagnosisName: z.string()
    .max(100, 'Diagnosis name must be 100 characters or less')
    .optional(),
  
  description: z.string().optional(),
  
  surgeryDate: z.string()
    .datetime('Surgery date must be a valid date')
    .optional(),
  
  surgeryTime: z.string()
    .datetime('Surgery time must be a valid time')
    .optional(),
  
  literality: LiteralityEnum.optional(),
  
  model: z.any().optional(),
});

// ===================================================================
// 🎯 PATIENT PLAN SCHEDULE SCHEMAS
// ===================================================================

/**
 * Create Patient Plan Schedule DTO
 */
export const CreatePatientPlanScheduleSchema = z.object({
  patientId: z.number()
    .int('Patient ID must be an integer')
    .positive('Patient ID must be positive'),
  
  planID: z.number()
    .int('Plan ID must be an integer')
    .positive('Plan ID must be positive'),
  
  type: ScheduleTypeEnum.optional(),
  
  typeID: z.number()
    .int('Type ID must be an integer')
    .positive('Type ID must be positive'),
  
  scheduleDate: z.string()
    .datetime('Schedule date must be a valid datetime'),
  
  frequencyUnit: FrequencyUnitEnum.optional(),
  
  frequencyValue: z.number()
    .int('Frequency value must be an integer')
    .min(1, 'Frequency value must be at least 1')
    .optional(),
  
  scheduleUnit: z.string().optional(),
  
  scheduleUnitValue: z.number()
    .min(0, 'Schedule unit value must be non-negative')
    .optional(),
  
  measurementUnit: MeasurementUnitEnum.optional(),
  
  validFrom: z.string()
    .datetime('Valid from must be a valid date')
    .optional(),
  
  validTo: z.string()
    .datetime('Valid to must be a valid date')
    .optional(),
  
  status: z.boolean().optional().default(true),
});

/**
 * Update Patient Plan Schedule DTO
 */
export const UpdatePatientPlanScheduleSchema = z.object({
  type: ScheduleTypeEnum.optional(),
  
  typeID: z.number()
    .int('Type ID must be an integer')
    .positive('Type ID must be positive')
    .optional(),
  
  scheduleDate: z.string()
    .datetime('Schedule date must be a valid datetime')
    .optional(),
  
  frequencyUnit: FrequencyUnitEnum.optional(),
  
  frequencyValue: z.number()
    .int('Frequency value must be an integer')
    .min(1, 'Frequency value must be at least 1')
    .optional(),
  
  scheduleUnit: z.string().optional(),
  
  scheduleUnitValue: z.number()
    .min(0, 'Schedule unit value must be non-negative')
    .optional(),
  
  measurementUnit: MeasurementUnitEnum.optional(),
  
  validFrom: z.string()
    .datetime('Valid from must be a valid date')
    .optional(),
  
  validTo: z.string()
    .datetime('Valid to must be a valid date')
    .optional(),
  
  status: z.boolean().optional(),
});

// ===================================================================
// 🎯 PATIENT PLAN SCHEDULE LOG SCHEMAS
// ===================================================================

/**
 * Create Patient Plan Schedule Log DTO
 */
export const CreatePatientPlanScheduleLogSchema = z.object({
  patientPlanScheduleId: z.number()
    .int('Patient plan schedule ID must be an integer')
    .positive('Patient plan schedule ID must be positive'),
  
  patientId: z.number()
    .int('Patient ID must be an integer')
    .positive('Patient ID must be positive'),
  
  planID: z.number()
    .int('Plan ID must be an integer')
    .positive('Plan ID must be positive'),
  
  type: ScheduleTypeEnum.optional(),
  
  typeId: z.number()
    .int('Type ID must be an integer')
    .positive('Type ID must be positive'),
  
  scheduleDate: z.string()
    .datetime('Schedule date must be a valid datetime')
    .optional(),
  
  frequencyUnit: FrequencyUnitEnum.optional(),
  
  frequencyValue: z.number()
    .int('Frequency value must be an integer')
    .min(1, 'Frequency value must be at least 1')
    .optional(),
  
  scheduleUnit: z.string()
    .max(50, 'Schedule unit must be 50 characters or less')
    .optional(),
  
  scheduleUnitValue: z.number()
    .min(0, 'Schedule unit value must be non-negative')
    .optional(),
  
  measurementUnit: MeasurementUnitEnum.optional(),
  
  validFrom: z.string()
    .datetime('Valid from must be a valid date')
    .optional(),
  
  validTo: z.string()
    .datetime('Valid to must be a valid date')
    .optional(),
  
  status: z.boolean().optional().default(true),
});

/**
 * Update Patient Plan Schedule Log DTO
 */
export const UpdatePatientPlanScheduleLogSchema = z.object({
  type: ScheduleTypeEnum.optional(),
  
  typeId: z.number()
    .int('Type ID must be an integer')
    .positive('Type ID must be positive')
    .optional(),
  
  scheduleDate: z.string()
    .datetime('Schedule date must be a valid datetime')
    .optional(),
  
  frequencyUnit: FrequencyUnitEnum.optional(),
  
  frequencyValue: z.number()
    .int('Frequency value must be an integer')
    .min(1, 'Frequency value must be at least 1')
    .optional(),
  
  scheduleUnit: z.string()
    .max(50, 'Schedule unit must be 50 characters or less')
    .optional(),
  
  scheduleUnitValue: z.number()
    .min(0, 'Schedule unit value must be non-negative')
    .optional(),
  
  measurementUnit: MeasurementUnitEnum.optional(),
  
  validFrom: z.string()
    .datetime('Valid from must be a valid date')
    .optional(),
  
  validTo: z.string()
    .datetime('Valid to must be a valid date')
    .optional(),
  
  status: z.boolean().optional(),
});

// ===================================================================
// 🎯 QUERY SCHEMAS
// ===================================================================

/**
 * Plan Query DTO
 */
export const PlanQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1),
  
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 20),
  
  search: z.string().optional(),
  
  diagnosisId: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined),
  
  diagnosisName: z.string().optional(),
  
  version: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined),
  
  sort: z.enum(['asc', 'desc'])
    .optional()
    .default('asc'),
  
  sortBy: z.enum(['name', 'diagnosisName', 'version', 'crDate'])
    .optional()
    .default('name'),
});

/**
 * Patient Plan Query DTO
 */
export const PatientPlanQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1),
  
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 20),
  
  search: z.string().optional(),
  
  patientId: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined),
  
  surgeonId: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined),
  
  diagnosisId: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined),
  
  planId: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined),
  
  surgeryDate: z.string().optional(),
  
  literality: LiteralityEnum.optional(),
  
  sort: z.enum(['asc', 'desc'])
    .optional()
    .default('asc'),
  
  sortBy: z.enum(['surgeryDate', 'crDate', 'patientId'])
    .optional()
    .default('surgeryDate'),
});

// ===================================================================
// 🎯 TYPE EXPORTS
// ===================================================================

export type Plan = z.infer<typeof PlanSchema>;
export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;
export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;
export type PlanQuery = z.infer<typeof PlanQuerySchema>;

export type PatientPlan = z.infer<typeof PatientPlanSchema>;
export type CreatePatientPlanInput = z.infer<typeof CreatePatientPlanSchema>;
export type UpdatePatientPlanInput = z.infer<typeof UpdatePatientPlanSchema>;
export type PatientPlanQuery = z.infer<typeof PatientPlanQuerySchema>;

export type CreatePatientPlanScheduleInput = z.infer<typeof CreatePatientPlanScheduleSchema>;
export type UpdatePatientPlanScheduleInput = z.infer<typeof UpdatePatientPlanScheduleSchema>;

export type CreatePatientPlanScheduleLogInput = z.infer<typeof CreatePatientPlanScheduleLogSchema>;
export type UpdatePatientPlanScheduleLogInput = z.infer<typeof UpdatePatientPlanScheduleLogSchema>;

// ===================================================================
// 🎯 FILTER INTERFACES FOR REPOSITORY
// ===================================================================

export interface PlanFilters {
  page?: number;
  limit?: number;
  search?: string;
  diagnosisId?: number;
  diagnosisName?: string;
  version?: number;
  sort?: 'asc' | 'desc';
}

export interface PatientPlanFilters {
  page?: number;
  limit?: number;
  search?: string;
  patientId?: number;
  surgeonId?: number;
  diagnosisId?: number;
  planId?: number;
  surgeryDate?: string;
  literality?: string;
  sort?: 'asc' | 'desc';
}

export interface ScheduleFilters {
  page?: number;
  limit?: number;
  patientId?: number;
  planId?: number;
  type?: string;
  scheduleDate?: string;
  status?: string;
  sort?: 'asc' | 'desc';
}

export interface ScheduleLogFilters {
  page?: number;
  limit?: number;
  scheduleId?: number;
  patientId?: number;
  startDate?: string;
  endDate?: string;
  sort?: 'asc' | 'desc';
}

// Repository data types
export type CreatePlanData = CreatePlanInput;
export type UpdatePlanData = UpdatePlanInput;
export type CreatePatientPlanData = CreatePatientPlanInput;
export type UpdatePatientPlanData = UpdatePatientPlanInput;
export type CreateScheduleData = CreatePatientPlanScheduleInput;
export type UpdateScheduleData = UpdatePatientPlanScheduleInput;
export type CreateScheduleLogData = CreatePatientPlanScheduleLogInput;
export type UpdateScheduleLogData = UpdatePatientPlanScheduleLogInput;

// ===================================================================
// 🎯 RESPONSE DTO INTERFACES
// ===================================================================

export interface PlanResponseDTO extends Plan {}

export interface PlanListResponseDTO {
  plans: PlanResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PatientPlanResponseDTO extends PatientPlan {}

export interface PatientPlanListResponseDTO {
  patientPlans: PatientPlanResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
