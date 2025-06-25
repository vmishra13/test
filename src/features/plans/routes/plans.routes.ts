/**
 * PLANS ROUTES - Plan-related route definitions
 * 
 * This file defines all HTTP routes for plan-related operations including:
 * - Plans (treatment plans)
 * - Patient Plans (assigned plans)
 * - Patient Plan Schedules (scheduled activities)
 * - Patient Plan Schedule Logs (activity tracking)
 */

import { Router } from 'express';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import {
  // Plan Controllers
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  
  // Patient Plan Controllers
  getPatientPlans,
  getPatientPlanById,
  createPatientPlan,
  updatePatientPlan,
  deletePatientPlan,
  
  // Patient Plan Schedule Controllers
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  
  // Patient Plan Schedule Log Controllers
  getScheduleLogs,
  getScheduleLogById,
  createScheduleLog,
  updateScheduleLog,
  deleteScheduleLog,
} from '../controllers/plans.controller';

import {
  validateId,
  validateCreatePlan,
  validateUpdatePlan,
  validatePlanFilters,
  validateCreatePatientPlan,
  validateUpdatePatientPlan,
  validatePatientPlanFilters,
  validateCreatePatientPlanSchedule,
  validateUpdatePatientPlanSchedule,
  validatePatientPlanScheduleFilters,
  validateCreatePatientPlanScheduleLog,
  validatePatientPlanScheduleLogFilters,
} from '../validators/plans.validators';

const router = Router();

// ===================================================================
// 🏥 PLAN ROUTES (Treatment Plans)
// ===================================================================

/**
 * GET /plans
 * Get all treatment plans with filtering and pagination
 * Access: All authenticated users (healthcare providers)
 */
router.get('/plans', authenticate, validatePlanFilters, getPlans);

/**
 * GET /plans/:id
 * Get treatment plan by ID
 * Access: All authenticated users (healthcare providers)
 */
router.get('/plans/:id', authenticate, validateId, getPlanById);

/**
 * POST /plans
 * Create new treatment plan
 * Access: Administrators and Clinical Staff
 */
router.post('/plans', authenticate, validateCreatePlan, createPlan);

/**
 * PUT /plans/:id
 * Update existing treatment plan
 * Access: Administrators and Clinical Staff
 */
router.put('/plans/:id', authenticate, validateId, validateUpdatePlan, updatePlan);

/**
 * DELETE /plans/:id
 * Delete treatment plan
 * Access: Administrators only
 */
router.delete('/plans/:id', authenticate, validateId, deletePlan);

// ===================================================================
// 👤 PATIENT PLAN ROUTES (Assigned Treatment Plans)
// ===================================================================

/**
 * GET /patient-plans
 * Get all patient plans with filtering and pagination
 * Access: Healthcare providers (filtered by patient access)
 */
router.get('/patient-plans', authenticate, validatePatientPlanFilters, getPatientPlans);

/**
 * GET /patient-plans/:id
 * Get patient plan by ID
 * Access: Healthcare providers (filtered by patient access)
 */
router.get('/patient-plans/:id', authenticate, validateId, getPatientPlanById);

/**
 * POST /patient-plans
 * Assign treatment plan to patient
 * Access: Healthcare providers
 */
router.post('/patient-plans', authenticate, validateCreatePatientPlan, createPatientPlan);

/**
 * PUT /patient-plans/:id
 * Update patient plan assignment
 * Access: Healthcare providers
 */
router.put('/patient-plans/:id', authenticate, validateId, validateUpdatePatientPlan, updatePatientPlan);

/**
 * DELETE /patient-plans/:id
 * Remove patient plan assignment
 * Access: Healthcare providers
 */
router.delete('/patient-plans/:id', authenticate, validateId, deletePatientPlan);

// ===================================================================
// 📅 PATIENT PLAN SCHEDULE ROUTES (Scheduled Activities)
// ===================================================================

/**
 * GET /patient-plan-schedules
 * Get all patient plan schedules with filtering and pagination
 * Access: Healthcare providers and patients (filtered by access)
 */
router.get('/patient-plan-schedules', authenticate, validatePatientPlanScheduleFilters, getSchedules);

/**
 * GET /patient-plan-schedules/:id
 * Get patient plan schedule by ID
 * Access: Healthcare providers and patients (filtered by access)
 */
router.get('/patient-plan-schedules/:id', authenticate, validateId, getScheduleById);

/**
 * POST /patient-plan-schedules
 * Create scheduled activity for patient plan
 * Access: Healthcare providers
 */
router.post('/patient-plan-schedules', authenticate, validateCreatePatientPlanSchedule, createSchedule);

/**
 * PUT /patient-plan-schedules/:id
 * Update scheduled activity
 * Access: Healthcare providers and patients (limited updates)
 */
router.put('/patient-plan-schedules/:id', authenticate, validateId, validateUpdatePatientPlanSchedule, updateSchedule);

/**
 * DELETE /patient-plan-schedules/:id
 * Delete scheduled activity
 * Access: Healthcare providers
 */
router.delete('/patient-plan-schedules/:id', authenticate, validateId, deleteSchedule);

// ===================================================================
// 📝 PATIENT PLAN SCHEDULE LOG ROUTES (Activity Tracking)
// ===================================================================

/**
 * GET /patient-plan-schedule-logs
 * Get all patient plan schedule logs with filtering and pagination
 * Access: Healthcare providers and patients (filtered by access)
 */
router.get('/patient-plan-schedule-logs', authenticate, validatePatientPlanScheduleLogFilters, getScheduleLogs);

/**
 * GET /patient-plan-schedule-logs/:id
 * Get patient plan schedule log by ID
 * Access: Healthcare providers and patients (filtered by access)
 */
router.get('/patient-plan-schedule-logs/:id', authenticate, validateId, getScheduleLogById);

/**
 * POST /patient-plan-schedule-logs
 * Log activity completion for patient plan schedule
 * Access: Healthcare providers and patients
 */
router.post('/patient-plan-schedule-logs', authenticate, validateCreatePatientPlanScheduleLog, createScheduleLog);

/**
 * PUT /patient-plan-schedule-logs/:id
 * Update activity log entry
 * Access: Healthcare providers and patients (own logs only)
 */
router.put('/patient-plan-schedule-logs/:id', authenticate, validateId, updateScheduleLog);

/**
 * DELETE /patient-plan-schedule-logs/:id
 * Delete activity log entry
 * Access: Healthcare providers
 */
router.delete('/patient-plan-schedule-logs/:id', authenticate, validateId, deleteScheduleLog);

export default router;
