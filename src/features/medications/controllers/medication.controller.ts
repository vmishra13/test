/**
 * MEDICATION CONTROLLER - HTTP request handlers
 *
 * This file contains all HTTP request handlers for medication master operations.
 * It handles request validation, calls business logic, and formats responses.
 */

import { Response, NextFunction } from 'express';
import * as medicationService from '../services/medication.service';
import { CreateMedicationSchema, UpdateMedicationSchema } from '../dto/medication.dto';
import type { ExtendedRequest } from '@shared/types';

// ===================================================================
// 🎯 CONTROLLER FUNCTIONS
// ===================================================================

/**
 * Get all medications with filtering and pagination
 */
export async function getAllMedications(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const clientId = req.user?.clientId;
    if (!clientId) {
      res.status(401).json({
        success: false,
        message: 'Client information not found',
      });
      return;
    }

    const result = await medicationService.getAllMedications(req.query, clientId);

    res.status(200).json({
      success: true,
      message: 'Medications retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single medication by ID
 */
export async function getMedicationById(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const clientId = req.user?.clientId;

    if (!clientId) {
      res.status(401).json({
        success: false,
        message: 'Client information not found',
      });
      return;
    }

    const medication = await medicationService.getMedicationById(id, clientId);

    res.status(200).json({
      success: true,
      message: 'Medication retrieved successfully',
      data: medication,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Medication not found') {
      res.status(404).json({
        success: false,
        message: 'Medication not found',
      });
      return;
    }
    next(error);
  }
}

/**
 * Create a new medication
 */
export async function createMedication(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const clientId = req.user?.clientId;
    const userId = req.user?.userId;

    if (!clientId || !userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication information not found',
      });
      return;
    }

    // Validate request body
    const validatedData = CreateMedicationSchema.parse(req.body);

    const medication = await medicationService.createMedication(
      validatedData,
      clientId,
      userId.toString(),
    );

    res.status(201).json({
      success: true,
      message: 'Medication created successfully',
      data: medication,
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
 * Update an existing medication
 */
export async function updateMedication(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const clientId = req.user?.clientId;
    const userId = req.user?.userId;

    if (!clientId || !userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication information not found',
      });
      return;
    }

    // Validate request body
    const validatedData = UpdateMedicationSchema.parse(req.body);

    const medication = await medicationService.updateMedication(
      id,
      validatedData,
      clientId,
      userId.toString(),
    );

    res.status(200).json({
      success: true,
      message: 'Medication updated successfully',
      data: medication,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Medication not found') {
        res.status(404).json({
          success: false,
          message: 'Medication not found',
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
 * Delete a medication
 */
export async function deleteMedication(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const clientId = req.user?.clientId;

    if (!clientId) {
      res.status(401).json({
        success: false,
        message: 'Client information not found',
      });
      return;
    }

    await medicationService.deleteMedication(id, clientId);

    res.status(200).json({
      success: true,
      message: 'Medication deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Medication not found') {
      res.status(404).json({
        success: false,
        message: 'Medication not found',
      });
      return;
    }
    next(error);
  }
}

/**
 * Get medication statistics
 */
export async function getMedicationStats(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const clientId = req.user?.clientId;

    if (!clientId) {
      res.status(401).json({
        success: false,
        message: 'Client information not found',
      });
      return;
    }

    const stats = await medicationService.getMedicationStats(clientId);

    res.status(200).json({
      success: true,
      message: 'Medication statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
