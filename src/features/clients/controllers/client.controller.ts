/**
 * CLIENT CONTROLLER - Business Logic & HTTP Interface
 * 
 * Handles all client-related HTTP requests and routes them to the service layer.
 * Follows the same pattern as UserController for consistency.
 * 
 * Features:
 * - Strict multi-tenant security isolation
 * - Role-based access control
 * - Consistent error handling patterns
 * - RESTful API design
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@shared/utils/api-response';
import type { AuthenticatedUser } from '@features/auth/dto/auth.dto';
import type {
  ExtendedRequest,
  ClientListRequest,
  ClientCreateRequest,
  ClientUpdateRequest,
  ClientDetailRequest,
  ClientStatusRequest,
} from '../types/extended-request';

// Service imports
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  updateClientStatus,
} from '../services/client.service';

/**
 * Client Controller Class
 * Handles all client-related operations with consistent security patterns
 */
export class ClientController {
  
  // ===================================================================
  // 🔍 READ OPERATIONS
  // ===================================================================

  /**
   * Get all clients with filtering and pagination (SUPER_ADMIN only)
   * GET /api/v1/clients
   */
  async getClients(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as AuthenticatedUser;
      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const extendedReq = req as ClientListRequest;
      extendedReq.user = user;

      const result = await getClients(extendedReq);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Failed to retrieve clients');
    }
  }

  /**
   * Get specific client by ID
   * GET /api/v1/clients/:id
   */
  async getClientById(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as AuthenticatedUser;
      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const extendedReq = req as ClientDetailRequest;
      extendedReq.user = user;

      const result = await getClientById(extendedReq);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Failed to retrieve client');
    }
  }

  // ===================================================================
  // ✏️ WRITE OPERATIONS
  // ===================================================================

  /**
   * Create new client (SUPER_ADMIN only)
   * POST /api/v1/clients
   */
  async createClient(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as AuthenticatedUser;
      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const extendedReq = req as ClientCreateRequest;
      extendedReq.user = user;

      const result = await createClient(extendedReq);
      res.status(StatusCodes.CREATED).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Failed to create client');
    }
  }

  /**
   * Update client (SUPER_ADMIN or CLIENT_ADMIN of same client)
   * PUT /api/v1/clients/:id
   */
  async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as AuthenticatedUser;
      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const extendedReq = req as ClientUpdateRequest;
      extendedReq.user = user;

      const result = await updateClient(extendedReq);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Failed to update client');
    }
  }

  /**
   * Update client status (SUPER_ADMIN only)
   * PATCH /api/v1/clients/:id/status
   */
  async updateClientStatus(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as AuthenticatedUser;
      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const extendedReq = req as ClientStatusRequest;
      extendedReq.user = user;

      const result = await updateClientStatus(extendedReq);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      this.handleError(res, error, 'Failed to update client status');
    }
  }

  // ===================================================================
  // 🛠️ UTILITY METHODS
  // ===================================================================

  /**
   * Centralized error handling for consistent API responses
   */
  private handleError(res: Response, error: any, defaultMessage: string): void {
    console.error(`${defaultMessage}:`, error);

    // Handle custom authentication errors
    if (error.name === 'AuthenticationError') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom authorization errors
    if (error.name === 'AuthorizationError') {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Authorization failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom validation errors
    if (error.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle custom not found errors
    if (error.name === 'NotFoundError') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Resource not found',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle database/Prisma errors
    if (error.code === 'P2002') {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        error: 'Resource already exists',
        details: 'Duplicate resource',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error.code === 'P2025') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Resource not found',
        details: 'The requested resource was not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Use specific status code if provided
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    
    res.status(statusCode).json({
      success: false,
      error: defaultMessage,
      details: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

// Export both class and individual functions for backward compatibility
export const clientController = new ClientController();

// Individual function exports for existing route compatibility
export const getClientsController = clientController.getClients.bind(clientController);
export const getClientByIdController = clientController.getClientById.bind(clientController);
export const createClientController = clientController.createClient.bind(clientController);
export const updateClientController = clientController.updateClient.bind(clientController);
export const updateClientStatusController = clientController.updateClientStatus.bind(clientController);

export default clientController;
