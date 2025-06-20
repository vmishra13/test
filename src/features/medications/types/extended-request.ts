/**
 * Extended Request Types for Medication Feature
 * 
 * This file defines extended request types that include user authentication
 * and context information needed for medication operations.
 */

import { Request } from 'express';
import { AuthenticatedUser } from '@/features/auth/dto/auth.dto';

export interface ExtendedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface MedicationQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  type?: string;
  category?: string;
  sort?: 'asc' | 'desc';
}

export interface MedicationRequest extends ExtendedRequest {
  query: MedicationQueryParams & { [key: string]: any };
}
