/**
 * Plans Service Layer
 *
 * This service handles business logic for plan-related operations:
 * - plan (treatment plans)
 * - patient_plan
 * - patient_plan_schedule
 * - patient_plan_schedule_log
 */

import { PlansRepository } from '../repositories/plans.repository';
import {
  CreatePlanInput,
  UpdatePlanInput,
  PlanFilters,
  CreatePatientPlanInput,
  UpdatePatientPlanInput,
  PatientPlanFilters,
  CreatePatientPlanScheduleInput,
  UpdatePatientPlanScheduleInput,
  ScheduleFilters,
  CreatePatientPlanScheduleLogInput,
  ScheduleLogFilters,
} from '../dto/plans.dto';
import { ApiResponse } from '@/shared/utils/api-response';
import { getCurrentUser } from '@features/auth';
import type { ExtendedRequest } from '@shared/types';

// ===================================================================
// 🎯 PLAN (TREATMENT PLAN) SERVICES
// ===================================================================

/**
 * Create a new treatment plan
 */
export async function createPlan(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const data = req.body as CreatePlanInput;
    const repository = new PlansRepository();

    const plan = await repository.createPlan({
      ...data,
      clientId: currentUser.clientId,
      crUser: currentUser.userId.toString(),
      modUser: currentUser.userId.toString(),
    });

    return ApiResponse.success(plan, 'Treatment plan created successfully');
  } catch (error: any) {
    console.error('Create plan error:', error);
    return ApiResponse.error('Failed to create treatment plan', 'PLAN_CREATE_ERROR', error.message);
  }
}

/**
 * Get treatment plans with filtering and pagination
 */
export async function getPlans(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const query = req.query as unknown as PlanFilters;
    const repository = new PlansRepository();

    const params = {
      page: query.page || 1,
      limit: Math.min(query.limit || 20, 100),
      search: query.search,
      diagnosisId: query.diagnosisId,
      diagnosisName: query.diagnosisName,
      version: query.version,
      sort: query.sort || ('desc' as const),
    };

    const result = await repository.getPlans(params, currentUser.clientId);

    return ApiResponse.success(result, 'Treatment plans retrieved successfully');
  } catch (error: any) {
    console.error('Get plans error:', error);
    return ApiResponse.error(
      'Failed to retrieve treatment plans',
      'PLAN_FETCH_ERROR',
      error.message,
    );
  }
}

/**
 * Get treatment plan by ID
 */
export async function getPlanById(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return ApiResponse.error('Invalid plan ID');
    }

    const repository = new PlansRepository();
    const plan = await repository.getPlanById(id, currentUser.clientId);

    if (!plan) {
      return ApiResponse.error('Treatment plan not found', 'PLAN_NOT_FOUND');
    }

    return ApiResponse.success(plan, 'Treatment plan retrieved successfully');
  } catch (error: any) {
    console.error('Get plan by ID error:', error);
    return ApiResponse.error(
      'Failed to retrieve treatment plan',
      'PLAN_FETCH_ERROR',
      error.message,
    );
  }
}

/**
 * Update treatment plan
 */
export async function updatePlan(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return ApiResponse.error('Invalid plan ID');
    }

    const data = req.body as UpdatePlanInput;
    const repository = new PlansRepository();

    const existingPlan = await repository.getPlanById(id, currentUser.clientId);

    if (!existingPlan) {
      return ApiResponse.error('Treatment plan not found', 'PLAN_NOT_FOUND');
    }

    const updatedPlan = await repository.updatePlan(
      id,
      data,
      currentUser.clientId,
      currentUser.userId.toString(),
    );

    return ApiResponse.success(updatedPlan, 'Treatment plan updated successfully');
  } catch (error: any) {
    console.error('Update plan error:', error);
    return ApiResponse.error('Failed to update treatment plan', 'PLAN_UPDATE_ERROR', error.message);
  }
}

/**
 * Delete treatment plan
 */
export async function deletePlan(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return ApiResponse.error('Invalid plan ID');
    }

    const repository = new PlansRepository();
    const existingPlan = await repository.getPlanById(id, currentUser.clientId);

    if (!existingPlan) {
      return ApiResponse.error('Treatment plan not found', 'PLAN_NOT_FOUND');
    }

    await repository.deletePlan(id, currentUser.clientId);

    return ApiResponse.success(null, 'Treatment plan deleted successfully');
  } catch (error: any) {
    console.error('Delete plan error:', error);
    return ApiResponse.error('Failed to delete treatment plan', 'PLAN_DELETE_ERROR', error.message);
  }
}

// ===================================================================
// 🎯 PATIENT PLAN SERVICES
// ===================================================================

/**
 * Create a new patient plan
 */
export async function createPatientPlan(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const data = req.body as CreatePatientPlanInput;
    const repository = new PlansRepository();

    const patientPlan = await repository.createPatientPlan({
      ...data,
      clientId: currentUser.clientId,
      crUser: currentUser.userId.toString(),
      modUser: currentUser.userId.toString(),
    });

    return ApiResponse.success(patientPlan, 'Patient plan created successfully');
  } catch (error: any) {
    console.error('Create patient plan error:', error);
    return ApiResponse.error(
      'Failed to create patient plan',
      'PATIENT_PLAN_CREATE_ERROR',
      error.message,
    );
  }
}

/**
 * Get patient plans with filtering and pagination
 */
export async function getPatientPlans(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const query = req.query as unknown as PatientPlanFilters;
    const repository = new PlansRepository();

    const params = {
      page: query.page || 1,
      limit: Math.min(query.limit || 20, 100),
      search: query.search,
      patientId: query.patientId,
      surgeonId: query.surgeonId,
      diagnosisId: query.diagnosisId,
      planId: query.planId,
      surgeryDate: query.surgeryDate,
      literality: query.literality,
      sort: query.sort || ('desc' as const),
    };

    const result = await repository.getPatientPlans(params, currentUser.clientId);

    return ApiResponse.success(result, 'Patient plans retrieved successfully');
  } catch (error: any) {
    console.error('Get patient plans error:', error);
    return ApiResponse.error(
      'Failed to retrieve patient plans',
      'PATIENT_PLAN_FETCH_ERROR',
      error.message,
    );
  }
}

/**
 * Get patient plan by ID
 */
export async function getPatientPlanById(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return ApiResponse.error('Invalid patient plan ID');
    }

    const repository = new PlansRepository();
    const patientPlan = await repository.getPatientPlanById(id, currentUser.clientId);

    if (!patientPlan) {
      return ApiResponse.error('Patient plan not found', 'PATIENT_PLAN_NOT_FOUND');
    }

    return ApiResponse.success(patientPlan, 'Patient plan retrieved successfully');
  } catch (error: any) {
    console.error('Get patient plan by ID error:', error);
    return ApiResponse.error(
      'Failed to retrieve patient plan',
      'PATIENT_PLAN_FETCH_ERROR',
      error.message,
    );
  }
}

/**
 * Update patient plan
 */
export async function updatePatientPlan(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return ApiResponse.error('Invalid patient plan ID');
    }

    const data = req.body as UpdatePatientPlanInput;
    const repository = new PlansRepository();

    const existingPatientPlan = await repository.getPatientPlanById(id, currentUser.clientId);

    if (!existingPatientPlan) {
      return ApiResponse.error('Patient plan not found', 'PATIENT_PLAN_NOT_FOUND');
    }

    const updatedPatientPlan = await repository.updatePatientPlan(
      id,
      data,
      currentUser.clientId,
      currentUser.userId.toString(),
    );

    return ApiResponse.success(updatedPatientPlan, 'Patient plan updated successfully');
  } catch (error: any) {
    console.error('Update patient plan error:', error);
    return ApiResponse.error(
      'Failed to update patient plan',
      'PATIENT_PLAN_UPDATE_ERROR',
      error.message,
    );
  }
}

/**
 * Delete patient plan
 */
export async function deletePatientPlan(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return ApiResponse.error('Invalid patient plan ID');
    }

    const repository = new PlansRepository();
    const existingPatientPlan = await repository.getPatientPlanById(id, currentUser.clientId);

    if (!existingPatientPlan) {
      return ApiResponse.error('Patient plan not found', 'PATIENT_PLAN_NOT_FOUND');
    }

    await repository.deletePatientPlan(id, currentUser.clientId);

    return ApiResponse.success(null, 'Patient plan deleted successfully');
  } catch (error: any) {
    console.error('Delete patient plan error:', error);
    return ApiResponse.error(
      'Failed to delete patient plan',
      'PATIENT_PLAN_DELETE_ERROR',
      error.message,
    );
  }
}

// ===================================================================
// 🎯 PATIENT PLAN SCHEDULE SERVICES
// ===================================================================

/**
 * Create a new patient plan schedule
 */
export async function createSchedule(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const data = req.body as CreatePatientPlanScheduleInput;
    const repository = new PlansRepository();

    const schedule = await repository.createSchedule({
      ...data,
      clientId: currentUser.clientId,
      crUser: currentUser.userId.toString(),
      modUser: currentUser.userId.toString(),
    });

    return ApiResponse.success(schedule, 'Patient plan schedule created successfully');
  } catch (error: any) {
    console.error('Create schedule error:', error);
    return ApiResponse.error(
      'Failed to create patient plan schedule',
      'SCHEDULE_CREATE_ERROR',
      error.message,
    );
  }
}

/**
 * Get patient plan schedules with filtering and pagination
 */
export async function getSchedules(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const query = req.query as unknown as ScheduleFilters;
    const repository = new PlansRepository();

    const params = {
      page: query.page || 1,
      limit: Math.min(query.limit || 20, 100),
      patientId: query.patientId,
      planId: query.planId,
      type: query.type,
      scheduleDate: query.scheduleDate,
      status: query.status,
      sort: query.sort || ('desc' as const),
    };

    const result = await repository.getSchedules(params, currentUser.clientId);

    return ApiResponse.success(result, 'Patient plan schedules retrieved successfully');
  } catch (error: any) {
    console.error('Get schedules error:', error);
    return ApiResponse.error(
      'Failed to retrieve patient plan schedules',
      'SCHEDULE_FETCH_ERROR',
      error.message,
    );
  }
}

/**
 * Get patient plan schedule by ID
 */
export async function getScheduleById(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return ApiResponse.error('Invalid schedule ID');
    }

    const repository = new PlansRepository();
    const schedule = await repository.getScheduleById(id, currentUser.clientId);

    if (!schedule) {
      return ApiResponse.error('Patient plan schedule not found', 'SCHEDULE_NOT_FOUND');
    }

    return ApiResponse.success(schedule, 'Patient plan schedule retrieved successfully');
  } catch (error: any) {
    console.error('Get schedule by ID error:', error);
    return ApiResponse.error(
      'Failed to retrieve patient plan schedule',
      'SCHEDULE_FETCH_ERROR',
      error.message,
    );
  }
}

/**
 * Update patient plan schedule
 */
export async function updateSchedule(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return ApiResponse.error('Invalid schedule ID');
    }

    const data = req.body as UpdatePatientPlanScheduleInput;
    const repository = new PlansRepository();

    const existingSchedule = await repository.getScheduleById(id, currentUser.clientId);

    if (!existingSchedule) {
      return ApiResponse.error('Patient plan schedule not found', 'SCHEDULE_NOT_FOUND');
    }

    const updatedSchedule = await repository.updateSchedule(
      id,
      data,
      currentUser.clientId,
      currentUser.userId.toString(),
    );

    return ApiResponse.success(updatedSchedule, 'Patient plan schedule updated successfully');
  } catch (error: any) {
    console.error('Update schedule error:', error);
    return ApiResponse.error(
      'Failed to update patient plan schedule',
      'SCHEDULE_UPDATE_ERROR',
      error.message,
    );
  }
}

/**
 * Delete patient plan schedule
 */
export async function deleteSchedule(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return ApiResponse.error('Invalid schedule ID');
    }

    const repository = new PlansRepository();
    const existingSchedule = await repository.getScheduleById(id, currentUser.clientId);

    if (!existingSchedule) {
      return ApiResponse.error('Patient plan schedule not found', 'SCHEDULE_NOT_FOUND');
    }

    await repository.deleteSchedule(id, currentUser.clientId);

    return ApiResponse.success(null, 'Patient plan schedule deleted successfully');
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    return ApiResponse.error(
      'Failed to delete patient plan schedule',
      'SCHEDULE_DELETE_ERROR',
      error.message,
    );
  }
}

// ===================================================================
// 🎯 PATIENT PLAN SCHEDULE LOG SERVICES
// ===================================================================

/**
 * Create a new schedule log entry
 */
export async function createScheduleLog(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const data = req.body as CreatePatientPlanScheduleLogInput;
    const repository = new PlansRepository();

    // Check if log already exists
    const exists = await repository.checkScheduleExists(
      data.patientPlanScheduleId,
      data.patientId,
      currentUser.clientId,
    );

    if (exists) {
      return ApiResponse.error(
        'Schedule log entry already exists for this patient and schedule',
        'SCHEDULE_LOG_EXISTS',
      );
    }

    const scheduleLog = await repository.createScheduleLog({
      ...data,
      clientId: currentUser.clientId,
      crUser: currentUser.userId.toString(),
      modUser: currentUser.userId.toString(),
    });

    return ApiResponse.success(scheduleLog, 'Schedule log entry created successfully');
  } catch (error: any) {
    console.error('Create schedule log error:', error);
    return ApiResponse.error(
      'Failed to create schedule log entry',
      'SCHEDULE_LOG_CREATE_ERROR',
      error.message,
    );
  }
}

/**
 * Get schedule logs with filtering and pagination
 */
export async function getScheduleLogs(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const query = req.query as unknown as ScheduleLogFilters;
    const repository = new PlansRepository();

    const params = {
      page: query.page || 1,
      limit: Math.min(query.limit || 20, 100),
      scheduleId: query.scheduleId,
      patientId: query.patientId,
      startDate: query.startDate,
      endDate: query.endDate,
      sort: query.sort || ('desc' as const),
    };

    const result = await repository.getScheduleLogs(params, currentUser.clientId);

    return ApiResponse.success(result, 'Schedule logs retrieved successfully');
  } catch (error: any) {
    console.error('Get schedule logs error:', error);
    return ApiResponse.error(
      'Failed to retrieve schedule logs',
      'SCHEDULE_LOG_FETCH_ERROR',
      error.message,
    );
  }
}

/**
 * Get schedule log by ID
 */
export async function getScheduleLogById(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return ApiResponse.error('Invalid schedule log ID');
    }

    const repository = new PlansRepository();
    const scheduleLog = await repository.getScheduleLogById(id, currentUser.clientId);

    if (!scheduleLog) {
      return ApiResponse.error('Schedule log entry not found', 'SCHEDULE_LOG_NOT_FOUND');
    }

    return ApiResponse.success(scheduleLog, 'Schedule log entry retrieved successfully');
  } catch (error: any) {
    console.error('Get schedule log by ID error:', error);
    return ApiResponse.error(
      'Failed to retrieve schedule log entry',
      'SCHEDULE_LOG_FETCH_ERROR',
      error.message,
    );
  }
}

/**
 * Update schedule log
 */
export async function updateScheduleLog(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return ApiResponse.error('Invalid schedule log ID');
    }

    const repository = new PlansRepository();

    // Check if schedule log exists and belongs to client
    const existingLog = await repository.getScheduleLogById(id, currentUser.clientId);
    if (!existingLog) {
      return ApiResponse.error('Schedule log entry not found', 'SCHEDULE_LOG_NOT_FOUND');
    }

    const scheduleLog = await repository.updateScheduleLog(id, req.body, {
      id: currentUser.userId,
      username: currentUser.loginName,
    });

    return ApiResponse.success(scheduleLog, 'Schedule log entry updated successfully');
  } catch (error: any) {
    console.error('Update schedule log error:', error);
    return ApiResponse.error(
      'Failed to update schedule log entry',
      'SCHEDULE_LOG_UPDATE_ERROR',
      error.message,
    );
  }
}

/**
 * Delete schedule log
 */
export async function deleteScheduleLog(req: ExtendedRequest) {
  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return ApiResponse.error('Authentication required');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return ApiResponse.error('Invalid schedule log ID');
    }

    const repository = new PlansRepository();

    // Check if schedule log exists and belongs to client
    const existingLog = await repository.getScheduleLogById(id, currentUser.clientId);
    if (!existingLog) {
      return ApiResponse.error('Schedule log entry not found', 'SCHEDULE_LOG_NOT_FOUND');
    }

    await repository.deleteScheduleLog(id);

    return ApiResponse.success(null, 'Schedule log entry deleted successfully');
  } catch (error: any) {
    console.error('Delete schedule log error:', error);
    return ApiResponse.error(
      'Failed to delete schedule log entry',
      'SCHEDULE_LOG_DELETE_ERROR',
      error.message,
    );
  }
}
