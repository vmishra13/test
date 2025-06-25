/**
 * DIAGNOSIS SERVICE - Business logic layer
 *
 * This file contains all business logic for diagnosis master operations.
 * It handles validation, authorization, and coordinates with the repository layer.
 */

import { ApiResponse } from '@/shared/utils/api-response';
import { getCurrentUser } from '@features/auth';
import type { AuthenticatedUser } from '@/features/auth/dto/auth.dto';
import type { ExtendedRequest } from '@shared/types';
import type {
  CreateDiagnosisInput,
  UpdateDiagnosisInput,
  DiagnosisQuery,
} from '../dto/diagnosis.dto';
import * as diagnosisRepository from '../repositories/diagnosis.repository';

// ===================================================================
// 🎯 SERVICE FUNCTIONS
// ===================================================================

/**
 * Get all diagnoses with filtering and pagination
 * HIPAA Compliant: No patient data involved, only master data
 */
export async function getDiagnoses(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    // Only authenticated users can access diagnosis master data
    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    // Parse and validate query parameters
    const query = req.query as unknown as DiagnosisQuery;

    const params = {
      page: query.page || 1,
      limit: Math.min(query.limit || 20, 100), // Cap at 100 for performance
      search: query.search,
      bodyArea: query.bodyArea,
      groupType: query.groupType,
      sort: query.sort || ('asc' as const),
    };

    const result = await diagnosisRepository.getDiagnoses(params);

    return ApiResponse.success(result, 'Diagnoses retrieved successfully');
  } catch (error: any) {
    console.error('Get diagnoses error:', error);
    return ApiResponse.error(
      'Failed to retrieve diagnoses',
      'DIAGNOSIS_FETCH_ERROR',
      error.message,
    );
  }
}

/**
 * Get diagnosis by ID
 * HIPAA Compliant: No patient data involved, only master data
 */
export async function getDiagnosisById(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const diagnosisId = parseInt(req.params.id);
    if (isNaN(diagnosisId)) {
      return ApiResponse.error('Invalid diagnosis ID');
    }

    const diagnosis = await diagnosisRepository.getDiagnosisById(diagnosisId);

    if (!diagnosis) {
      return ApiResponse.error('Diagnosis not found');
    }

    return ApiResponse.success(diagnosis, 'Diagnosis retrieved successfully');
  } catch (error: any) {
    console.error('Get diagnosis error:', error);
    return ApiResponse.error(
      'Failed to retrieve diagnosis',
      'DIAGNOSIS_FETCH_ERROR',
      error.message,
    );
  }
}

/**
 * Create new diagnosis
 * HIPAA Compliant: Only authorized clinical staff can manage master data
 */
export async function createDiagnosis(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    // Only SUPER_ADMIN and CLINICAL_STAFF can create diagnoses
    if (!hasRequiredRole(currentUser, ['SUPER_ADMIN', 'CLIENT_ADMIN', 'CLINICAL_STAFF'])) {
      return ApiResponse.error('Insufficient permissions to create diagnosis');
    }

    const data = req.body as CreateDiagnosisInput;

    // Check if diagnosis name already exists
    if (data.name && (await diagnosisRepository.diagnosisNameExists(data.name))) {
      return ApiResponse.error('Diagnosis with this name already exists');
    }

    const diagnosis = await diagnosisRepository.createDiagnosis(data, currentUser.loginName);

    return ApiResponse.success(diagnosis, 'Diagnosis created successfully');
  } catch (error: any) {
    console.error('Create diagnosis error:', error);
    return ApiResponse.error('Failed to create diagnosis', 'DIAGNOSIS_CREATE_ERROR', error.message);
  }
}

/**
 * Update diagnosis
 * HIPAA Compliant: Only authorized clinical staff can manage master data
 */
export async function updateDiagnosis(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    // Only SUPER_ADMIN and CLINICAL_STAFF can update diagnoses
    if (!hasRequiredRole(currentUser, ['SUPER_ADMIN', 'CLIENT_ADMIN', 'CLINICAL_STAFF'])) {
      return ApiResponse.error('Insufficient permissions to update diagnosis');
    }

    const diagnosisId = parseInt(req.params.id);
    if (isNaN(diagnosisId)) {
      return ApiResponse.error('Invalid diagnosis ID');
    }

    // Check if diagnosis exists
    const existingDiagnosis = await diagnosisRepository.getDiagnosisById(diagnosisId);
    if (!existingDiagnosis) {
      return ApiResponse.error('Diagnosis not found');
    }

    const data = req.body as UpdateDiagnosisInput;

    // Check if new name conflicts with existing diagnosis
    if (data.name && (await diagnosisRepository.diagnosisNameExists(data.name, diagnosisId))) {
      return ApiResponse.error('Diagnosis with this name already exists');
    }

    const updatedDiagnosis = await diagnosisRepository.updateDiagnosis(
      diagnosisId,
      data,
      currentUser.loginName,
    );

    return ApiResponse.success(updatedDiagnosis, 'Diagnosis updated successfully');
  } catch (error: any) {
    console.error('Update diagnosis error:', error);
    return ApiResponse.error('Failed to update diagnosis', 'DIAGNOSIS_UPDATE_ERROR', error.message);
  }
}

/**
 * Delete diagnosis
 * HIPAA Compliant: Only authorized clinical staff can manage master data
 */
export async function deleteDiagnosis(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    // Only SUPER_ADMIN can delete diagnoses (hard delete)
    if (!hasRequiredRole(currentUser, ['SUPER_ADMIN'])) {
      return ApiResponse.error('Insufficient permissions to delete diagnosis');
    }

    const diagnosisId = parseInt(req.params.id);
    if (isNaN(diagnosisId)) {
      return ApiResponse.error('Invalid diagnosis ID');
    }

    // Check if diagnosis exists
    if (!(await diagnosisRepository.diagnosisExists(diagnosisId))) {
      return ApiResponse.error('Diagnosis not found');
    }

    await diagnosisRepository.deleteDiagnosis(diagnosisId);

    return ApiResponse.success({}, 'Diagnosis deleted successfully');
  } catch (error: any) {
    console.error('Delete diagnosis error:', error);

    // Handle foreign key constraints
    if (error.code === 'P2003') {
      return ApiResponse.error('Cannot delete diagnosis as it is being used in treatment plans');
    }

    return ApiResponse.error('Failed to delete diagnosis', 'DIAGNOSIS_DELETE_ERROR', error.message);
  }
}

/**
 * Get unique body areas
 */
export async function getBodyAreas(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const bodyAreas = await diagnosisRepository.getUniqueBodyAreas();

    return ApiResponse.success(bodyAreas, 'Body areas retrieved successfully');
  } catch (error: any) {
    console.error('Get body areas error:', error);
    return ApiResponse.error(
      'Failed to retrieve body areas',
      'DIAGNOSIS_BODY_AREAS_ERROR',
      error.message,
    );
  }
}

/**
 * Get unique group types
 */
export async function getGroupTypes(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const groupTypes = await diagnosisRepository.getUniqueGroupTypes();

    return ApiResponse.success(groupTypes, 'Group types retrieved successfully');
  } catch (error: any) {
    console.error('Get group types error:', error);
    return ApiResponse.error(
      'Failed to retrieve group types',
      'DIAGNOSIS_GROUP_TYPES_ERROR',
      error.message,
    );
  }
}

// ===================================================================
// 🎯 HELPER FUNCTIONS
// ===================================================================

/**
 * Check if user has required role
 */
function hasRequiredRole(user: AuthenticatedUser, requiredRoles: string[]): boolean {
  if (!user.roles || user.roles.length === 0) {
    return false;
  }

  return user.roles.some(role => requiredRoles.includes(role));
}
