/**
 * Extended Request Types for Exercise Feature
 * 
 * This file defines extended request types that include user authentication
 * and context information needed for exercise operations.
 */

import { Request } from 'express';
import { AuthenticatedUser } from '@/features/auth/dto/auth.dto';

export interface ExtendedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ExerciseQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  media_type?: string;
  frequency_period?: string;
  unit?: string;
  sort?: 'asc' | 'desc';
}

export interface ExerciseRequest extends ExtendedRequest {
  query: ExerciseQueryParams & { [key: string]: any };
}
