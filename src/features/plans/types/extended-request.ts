/**
 * Extended Request Types for Plans Feature
 * 
 * This file defines extended request types that include user authentication
 * and context information needed for plans operations.
 */

import { Request } from 'express';
import { AuthenticatedUser } from '@/features/auth/dto/auth.dto';

export interface ExtendedRequest extends Request {
  user: AuthenticatedUser;
}

export interface PlanQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  diagnosisId?: string;
  diagnosisName?: string;
  version?: string;
  sort?: 'asc' | 'desc';
}

export interface PatientPlanQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  patientId?: string;
  surgeonId?: string;
  diagnosisId?: string;
  planId?: string;
  surgeryDate?: string;
  literality?: string;
  sort?: 'asc' | 'desc';
}

export interface ScheduleQueryParams {
  page?: string;
  limit?: string;
  patientId?: string;
  planId?: string;
  type?: string;
  scheduleDate?: string;
  status?: string;
  sort?: 'asc' | 'desc';
}

export interface PlanRequest extends ExtendedRequest {
  query: PlanQueryParams & { [key: string]: any };
}

export interface PatientPlanRequest extends ExtendedRequest {
  query: PatientPlanQueryParams & { [key: string]: any };
}

export interface ScheduleRequest extends ExtendedRequest {
  query: ScheduleQueryParams & { [key: string]: any };
}
