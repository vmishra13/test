/**
 * SHARED REQUEST TYPES
 *
 * Common request interfaces and types used across all features
 * to ensure consistency and reduce duplication.
 */

import { Request } from 'express';
import type { AuthenticatedUser } from '@features/auth/dto/auth.dto';

/**
 * Extended request interface with authenticated user and typed body/query
 *
 * This interface extends Express Request to include:
 * - Authenticated user from JWT middleware
 * - Type-safe query parameters
 * - Type-safe request body
 */
export interface ExtendedRequest<TQuery = any, TBody = any>
  extends Omit<Request, 'body' | 'query'> {
  user: AuthenticatedUser;
  query: TQuery;
  body: TBody;
}

/**
 * Base interface for pagination parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
}

/**
 * Base interface for search parameters
 */
export interface SearchQuery {
  search?: string;
}

/**
 * Combined base query interface for common operations
 */
export interface BaseQuery extends PaginationQuery, SearchQuery {
  status?: number;
}
