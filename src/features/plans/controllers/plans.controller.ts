/**
 * Plans Controllers
 * 
 * This file contains all HTTP request handlers for plan-related operations:
 * - plan (treatment plans)
 * - patient_plan 
 * - patient_plan_schedule
 * - patient_plan_schedule_log
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as plansService from '../services/plans.service';

// ===================================================================
// 🎯 PLAN (TREATMENT PLAN) CONTROLLERS
// ===================================================================

/**
 * Create a new treatment plan
 */
export const createPlan = async (req: Request, res: Response) => {
  try {
    const result = await plansService.createPlan(req as any);
    const statusCode = result.success ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Create plan controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Get treatment plans with filtering and pagination
 */
export const getPlans = async (req: Request, res: Response) => {
  try {
    const result = await plansService.getPlans(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get plans controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Get treatment plan by ID
 */
export const getPlanById = async (req: Request, res: Response) => {
  try {
    const result = await plansService.getPlanById(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.NOT_FOUND;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get plan by ID controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Update treatment plan
 */
export const updatePlan = async (req: Request, res: Response) => {
  try {
    const result = await plansService.updatePlan(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Update plan controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Delete treatment plan
 */
export const deletePlan = async (req: Request, res: Response) => {
  try {
    const result = await plansService.deletePlan(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.NOT_FOUND;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Delete plan controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

// ===================================================================
// 🎯 PATIENT PLAN CONTROLLERS
// ===================================================================

/**
 * Create a new patient plan
 */
export const createPatientPlan = async (req: Request, res: Response) => {
  try {
    const result = await plansService.createPatientPlan(req as any);
    const statusCode = result.success ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Create patient plan controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Get patient plans with filtering and pagination
 */
export const getPatientPlans = async (req: Request, res: Response) => {
  try {
    const result = await plansService.getPatientPlans(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get patient plans controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Get patient plan by ID
 */
export const getPatientPlanById = async (req: Request, res: Response) => {
  try {
    const result = await plansService.getPatientPlanById(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.NOT_FOUND;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get patient plan by ID controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Update patient plan
 */
export const updatePatientPlan = async (req: Request, res: Response) => {
  try {
    const result = await plansService.updatePatientPlan(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Update patient plan controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Delete patient plan
 */
export const deletePatientPlan = async (req: Request, res: Response) => {
  try {
    const result = await plansService.deletePatientPlan(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.NOT_FOUND;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Delete patient plan controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

// ===================================================================
// 🎯 PATIENT PLAN SCHEDULE CONTROLLERS
// ===================================================================

/**
 * Create a new patient plan schedule
 */
export const createSchedule = async (req: Request, res: Response) => {
  try {
    const result = await plansService.createSchedule(req as any);
    const statusCode = result.success ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Create schedule controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Get patient plan schedules with filtering and pagination
 */
export const getSchedules = async (req: Request, res: Response) => {
  try {
    const result = await plansService.getSchedules(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get schedules controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Get patient plan schedule by ID
 */
export const getScheduleById = async (req: Request, res: Response) => {
  try {
    const result = await plansService.getScheduleById(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.NOT_FOUND;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get schedule by ID controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Update patient plan schedule
 */
export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const result = await plansService.updateSchedule(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Update schedule controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Delete patient plan schedule
 */
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const result = await plansService.deleteSchedule(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.NOT_FOUND;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Delete schedule controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

// ===================================================================
// 🎯 PATIENT PLAN SCHEDULE LOG CONTROLLERS
// ===================================================================

/**
 * Create a new schedule log entry
 */
export const createScheduleLog = async (req: Request, res: Response) => {
  try {
    const result = await plansService.createScheduleLog(req as any);
    const statusCode = result.success ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Create schedule log controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Get schedule logs with filtering and pagination
 */
export const getScheduleLogs = async (req: Request, res: Response) => {
  try {
    const result = await plansService.getScheduleLogs(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get schedule logs controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Get schedule log by ID
 */
export const getScheduleLogById = async (req: Request, res: Response) => {
  try {
    const result = await plansService.getScheduleLogById(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.NOT_FOUND;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get schedule log by ID controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Update schedule log
 */
export const updateScheduleLog = async (req: Request, res: Response) => {
  try {
    const result = await plansService.updateScheduleLog(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Update schedule log controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};

/**
 * Delete schedule log
 */
export const deleteScheduleLog = async (req: Request, res: Response) => {
  try {
    const result = await plansService.deleteScheduleLog(req as any);
    const statusCode = result.success ? StatusCodes.OK : StatusCodes.NOT_FOUND;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Delete schedule log controller error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'CONTROLLER_ERROR'
    });
  }
};
