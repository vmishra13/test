import { Request } from 'express';
import type { AuthenticatedUser } from '../../auth/dto/auth.dto';
import type { 
  GetClientsQueryRequest,
  CreateClientRequest,
  UpdateClientRequest 
} from '../dto/client.dto';

/**
 * Client request actions for authorization
 */
export enum RequestClientAction {
  clAdd = 'clAdd',       // Add a new client
  clEdit = 'clEdit',     // Edit an existing client  
  clView = 'clView',     // View client details
  clDelete = 'clDelete', // Delete a client
  clList = 'clList',     // List clients
}

/**
 * Extended request interface with authenticated user and typed body/query
 */
export interface ExtendedRequest<TQuery = any, TBody = any>
  extends Omit<Request, 'body' | 'query'> {
  user: AuthenticatedUser;
  query: TQuery;
  body: TBody;
}

/**
 * Specific request types for client operations
 */
export type ClientListRequest = ExtendedRequest<GetClientsQueryRequest>;
export type ClientCreateRequest = ExtendedRequest<any, CreateClientRequest>;
export type ClientUpdateRequest = ExtendedRequest<{ id: string }, UpdateClientRequest>;
export type ClientDetailRequest = ExtendedRequest<{ id: string }>;
export type ClientStatusRequest = ExtendedRequest<{ id: string }, { status: number }>;
