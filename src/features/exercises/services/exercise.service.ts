/**
 * EXERCISE SERVICE - Business logic layer
 * 
 * This file contains the business logic for exercise master operations.
 * It acts as a bridge between the controller and repository layers.
 */

import * as exerciseRepository from '../repositories/exercise.repository';
import { CreateExerciseInput, UpdateExerciseInput } from '../dto/exercise.dto';
import { ExerciseIdSchema, ExerciseParamsSchema } from '../validators/exercise.validators';

// ===================================================================
// 🎯 SERVICE FUNCTIONS
// ===================================================================

/**
 * Get all exercises with filtering and pagination
 */
export async function getAllExercises(query: any) {
  // Validate query parameters
  const validatedQuery = ExerciseParamsSchema.parse(query);
  
  const result = await exerciseRepository.getExercises({
    page: validatedQuery.page || 1,
    limit: validatedQuery.limit || 20,
    search: validatedQuery.search,
    media_type: validatedQuery.media_type,
    frequencyPeriod: validatedQuery.frequencyPeriod,
    unit: validatedQuery.unit,
    sort: validatedQuery.sort || 'asc',
  });

  return result;
}

/**
 * Get a single exercise by ID
 */
export async function getExerciseById(id: string) {
  // Validate ID
  const validatedParams = ExerciseIdSchema.parse({ id });
  
  const exercise = await exerciseRepository.getExerciseById(validatedParams.id);
  
  if (!exercise) {
    throw new Error('Exercise not found');
  }
  
  return exercise;
}

/**
 * Create a new exercise
 */
export async function createExercise(
  data: CreateExerciseInput,
  userId: string
) {
  // Check if exercise with same title already exists
  const exists = await exerciseRepository.exerciseExistsByTitle(data.title);
  
  if (exists) {
    throw new Error('An exercise with this title already exists');
  }
  
  const exercise = await exerciseRepository.createExercise(data, userId);
  
  return exercise;
}

/**
 * Update an existing exercise
 */
export async function updateExercise(
  id: string,
  data: UpdateExerciseInput,
  userId: string
) {
  // Validate ID
  const validatedParams = ExerciseIdSchema.parse({ id });
  
  // Check if exercise exists
  const existingExercise = await exerciseRepository.getExerciseById(validatedParams.id);
  if (!existingExercise) {
    throw new Error('Exercise not found');
  }
  
  // Check for title conflicts if title is being updated
  if (data.title && data.title !== existingExercise.title) {
    const titleExists = await exerciseRepository.exerciseExistsByTitle(
      data.title,
      validatedParams.id
    );
    
    if (titleExists) {
      throw new Error('An exercise with this title already exists');
    }
  }
  
  const exercise = await exerciseRepository.updateExercise(
    validatedParams.id,
    data,
    userId
  );
  
  return exercise;
}

/**
 * Delete an exercise
 */
export async function deleteExercise(id: string) {
  // Validate ID
  const validatedParams = ExerciseIdSchema.parse({ id });
  
  // Check if exercise exists
  const existingExercise = await exerciseRepository.getExerciseById(validatedParams.id);
  if (!existingExercise) {
    throw new Error('Exercise not found');
  }
  
  const result = await exerciseRepository.deleteExercise(validatedParams.id);
  
  return result;
}

/**
 * Get exercise statistics
 */
export async function getExerciseStats() {
  const stats = await exerciseRepository.getExerciseStats();
  return stats;
}
