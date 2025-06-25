/**
 * Extended Request Types for Diagnosis Feature
 * 
 * This file defines extended request types that include user authentication
 * and context information needed for diagnosis operations.
 */

import { Request } from 'express';
import { AuthenticatedUser } from '@/features/auth/dto/auth.dto';

export interface ExtendedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface DiagnosisQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  bodyArea?: string;
  groupType?: string;
  sort?: 'asc' | 'desc';
}

export interface DiagnosisRequest extends ExtendedRequest {
  query: DiagnosisQueryParams & { [key: string]: any };
}
