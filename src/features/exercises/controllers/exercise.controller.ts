/**
 * EXERCISE CONTROLLER - HTTP request handlers
 *
 * This file contains all HTTP request handlers for exercise master operations.
 * It handles request validation, calls business logic, and formats responses.
 */

import { Response, NextFunction } from 'express';
import * as exerciseService from '../services/exercise.service';
import { CreateExerciseSchema, UpdateExerciseSchema } from '../dto/exercise.dto';
import type { ExtendedRequest } from '@shared/types';

// ===================================================================
// 🎯 CONTROLLER FUNCTIONS
// ===================================================================

/**
 * Get all exercises with filtering and pagination
 */
export async function getAllExercises(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await exerciseService.getAllExercises(req.query);

    res.status(200).json({
      success: true,
      message: 'Exercises retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single exercise by ID
 */
export async function getExerciseById(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    const exercise = await exerciseService.getExerciseById(id);

    res.status(200).json({
      success: true,
      message: 'Exercise retrieved successfully',
      data: exercise,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Exercise not found') {
      res.status(404).json({
        success: false,
        message: 'Exercise not found',
      });
      return;
    }
    next(error);
  }
}

/**
 * Create a new exercise
 */
export async function createExercise(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication information not found',
      });
      return;
    }

    // Validate request body
    const validatedData = CreateExerciseSchema.parse(req.body);

    const exercise = await exerciseService.createExercise(validatedData, userId.toString());

    res.status(201).json({
      success: true,
      message: 'Exercise created successfully',
      data: exercise,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
}

/**
 * Update an existing exercise
 */
export async function updateExercise(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication information not found',
      });
      return;
    }

    // Validate request body
    const validatedData = UpdateExerciseSchema.parse(req.body);

    const exercise = await exerciseService.updateExercise(id, validatedData, userId.toString());

    res.status(200).json({
      success: true,
      message: 'Exercise updated successfully',
      data: exercise,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Exercise not found') {
        res.status(404).json({
          success: false,
          message: 'Exercise not found',
        });
        return;
      }
      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }
    next(error);
  }
}

/**
 * Delete an exercise
 */
export async function deleteExercise(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    await exerciseService.deleteExercise(id);

    res.status(200).json({
      success: true,
      message: 'Exercise deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Exercise not found') {
      res.status(404).json({
        success: false,
        message: 'Exercise not found',
      });
      return;
    }
    next(error);
  }
}

/**
 * Get exercise statistics
 */
export async function getExerciseStats(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await exerciseService.getExerciseStats();

    res.status(200).json({
      success: true,
      message: 'Exercise statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
