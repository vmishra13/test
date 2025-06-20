/**
 * EXERCISE MASTER DTOs - Data Transfer Objects
 * 
 * This file contains all DTOs for exercise master operations.
 * DTOs define the structure of data that flows between different layers
 * of the application and ensure type safety.
 */

import { z } from 'zod';

// ===================================================================
// 🎯 CORE DTO SCHEMAS  
// ===================================================================

/**
 * Core Exercise schema
 */
export const ExerciseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().max(100),
  description: z.string().optional(),
  purpose: z.string().max(255).optional(),
  media_type: z.enum(['video', 'image', 'audio', 'document']).optional(),
  media_url: z.string().max(2048).optional(),
  frequencyPeriod: z.enum(['Day', 'Week', 'Month']).optional(),
  unit: z.enum(['Set', 'Rep', 'Time', 'Distance']).optional(),
  value: z.number().int().optional(),
  setUnit: z.number().int().optional(),
  repetition: z.number().int().optional(),
  procedure: z.string().max(1024).optional(),
  note: z.string().optional(),
  show_checkbox: z.boolean().optional(),
  crUser: z.string().max(50),
  crDate: z.date().optional(),
  modUser: z.string().max(50),
  modDate: z.date().optional(),
});

// ===================================================================
// 🎯 CREATE/UPDATE DTO SCHEMAS
// ===================================================================

/**
 * Create Exercise DTO - Used for creating new exercises
 */
export const CreateExerciseSchema = z.object({
  title: z.string()
    .min(1, 'Exercise title is required')
    .max(100, 'Exercise title must be 100 characters or less'),
  
  description: z.string().optional(),
  
  purpose: z.string()
    .max(255, 'Purpose must be 255 characters or less')
    .optional(),
  
  media_type: z.enum(['video', 'image', 'audio', 'document'], {
    errorMap: () => ({ message: 'Media type must be video, image, audio, or document' })
  }).optional(),
  
  media_url: z.string()
    .url('Media URL must be a valid URL')
    .max(2048, 'Media URL must be 2048 characters or less')
    .optional(),
  
  frequencyPeriod: z.enum(['Day', 'Week', 'Month'], {
    errorMap: () => ({ message: 'Frequency period must be Day, Week, or Month' })
  }).optional(),
  
  unit: z.enum(['Set', 'Rep', 'Time', 'Distance'], {
    errorMap: () => ({ message: 'Unit must be Set, Rep, Time, or Distance' })
  }).optional(),
  
  value: z.number()
    .int('Value must be an integer')
    .min(0, 'Value must be non-negative')
    .optional(),
  
  setUnit: z.number()
    .int('Set unit must be an integer')
    .min(0, 'Set unit must be non-negative')
    .optional(),
  
  repetition: z.number()
    .int('Repetition must be an integer')
    .min(0, 'Repetition must be non-negative')
    .optional(),
  
  procedure: z.string()
    .max(1024, 'Procedure must be 1024 characters or less')
    .optional(),
  
  note: z.string().optional(),
  
  show_checkbox: z.boolean().optional(),
});

/**
 * Update Exercise DTO - Used for updating existing exercises
 */
export const UpdateExerciseSchema = z.object({
  title: z.string()
    .min(1, 'Exercise title cannot be empty')
    .max(100, 'Exercise title must be 100 characters or less')
    .optional(),
  
  description: z.string().optional(),
  
  purpose: z.string()
    .max(255, 'Purpose must be 255 characters or less')
    .optional(),
  
  media_type: z.enum(['video', 'image', 'audio', 'document'], {
    errorMap: () => ({ message: 'Media type must be video, image, audio, or document' })
  }).optional(),
  
  media_url: z.string()
    .url('Media URL must be a valid URL')
    .max(2048, 'Media URL must be 2048 characters or less')
    .optional(),
  
  frequencyPeriod: z.enum(['Day', 'Week', 'Month'], {
    errorMap: () => ({ message: 'Frequency period must be Day, Week, or Month' })
  }).optional(),
  
  unit: z.enum(['Set', 'Rep', 'Time', 'Distance'], {
    errorMap: () => ({ message: 'Unit must be Set, Rep, Time, or Distance' })
  }).optional(),
  
  value: z.number()
    .int('Value must be an integer')
    .min(0, 'Value must be non-negative')
    .optional(),
  
  setUnit: z.number()
    .int('Set unit must be an integer')
    .min(0, 'Set unit must be non-negative')
    .optional(),
  
  repetition: z.number()
    .int('Repetition must be an integer')
    .min(0, 'Repetition must be non-negative')
    .optional(),
  
  procedure: z.string()
    .max(1024, 'Procedure must be 1024 characters or less')
    .optional(),
  
  note: z.string().optional(),
  
  show_checkbox: z.boolean().optional(),
});

// ===================================================================
// 🎯 QUERY DTO SCHEMAS
// ===================================================================

/**
 * Exercise Query DTO - Used for filtering and pagination
 */
export const ExerciseQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1),
  
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 20),
  
  search: z.string().optional(),
  
  media_type: z.enum(['video', 'image', 'audio', 'document']).optional(),
  
  frequencyPeriod: z.enum(['Day', 'Week', 'Month']).optional(),
  
  unit: z.enum(['Set', 'Rep', 'Time', 'Distance']).optional(),
  
  sort: z.enum(['asc', 'desc'])
    .optional()
    .default('asc'),
  
  sortBy: z.enum(['title', 'purpose', 'crDate'])
    .optional()
    .default('title'),
});

// ===================================================================
// 🎯 TYPE EXPORTS
// ===================================================================

export type Exercise = z.infer<typeof ExerciseSchema>;
export type CreateExerciseInput = z.infer<typeof CreateExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof UpdateExerciseSchema>;
export type ExerciseQuery = z.infer<typeof ExerciseQuerySchema>;

// ===================================================================
// 🎯 RESPONSE DTO INTERFACES
// ===================================================================

export interface ExerciseResponseDTO extends Exercise {}

export interface ExerciseListResponseDTO {
  exercises: ExerciseResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
