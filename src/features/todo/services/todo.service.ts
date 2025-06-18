import * as todoRepository from '../repositories/todo.repository';
import logger from '@config/logger';
import { TodoCreateInput, TodoUpdateInput, Todo } from '../models/todo.model';
import { Request } from 'express';
import { getCurrentUser } from '@features/auth';
import { CoreRole } from '@shared/constants/roles';
import { createAuthorizationError, createValidationError } from '@/shared/errors/application-error';

/**
 * Get all todos with STRICT client isolation
 * HIPAA/PHI Protection: Only returns todos for the authenticated user's client
 */
export const getAllTodos = async (req: Request): Promise<Todo[]> => {
  try {
    const currentUser = getCurrentUser(req as any);
    
    if (!currentUser.clientId) {
      throw createAuthorizationError('Client context required for data access');
    }

    logger.info('Getting todos for client', { 
      userId: currentUser.userId, 
      clientId: currentUser.clientId 
    });

    // CRITICAL: Always filter by clientId to prevent cross-client data leakage
    return todoRepository.findTodosByClientId(currentUser.clientId);
  } catch (error: any) {
    logger.error('Error getting todos:', error);
    throw error;
  }
};

/**
 * Get todo by ID with STRICT client validation
 * HIPAA/PHI Protection: Only allows access to todos within the same client
 */
export const getTodoById = async (req: Request, id: number): Promise<Todo | null> => {
  try {
    const currentUser = getCurrentUser(req as any);
    
    if (!currentUser.clientId) {
      throw createAuthorizationError('Client context required for data access');
    }

    logger.info('Getting todo by ID with client validation', { 
      id, 
      userId: currentUser.userId, 
      clientId: currentUser.clientId 
    });

    // CRITICAL: Get todo with client validation
    const todo = await todoRepository.findTodoByIdAndClientId(id, currentUser.clientId);
    
    if (!todo) {
      throw createAuthorizationError('Todo not found or access denied');
    }

    return todo;
  } catch (error: any) {
    logger.error('Error getting todo by ID:', error);
    throw error;
  }
};

/**
 * Create todo with STRICT client assignment
 * HIPAA/PHI Protection: Always assigns todo to the user's client
 */
export const createTodo = async (req: Request, data: TodoCreateInput): Promise<Todo> => {
  try {
    const currentUser = getCurrentUser(req as any);
    
    if (!currentUser.clientId) {
      throw createAuthorizationError('Client context required for data creation');
    }

    logger.info('Creating new todo with client assignment', { 
      title: data.title, 
      userId: currentUser.userId,
      clientId: currentUser.clientId 
    });

    // CRITICAL: Always assign todo to the user's client
    const todoWithClient = {
      ...data,
      clientId: currentUser.clientId,
      userId: currentUser.userId,
    };

    return todoRepository.createTodoWithClient(todoWithClient);
  } catch (error: any) {
    logger.error('Error creating todo:', error);
    throw error;
  }
};

/**
 * Update todo with STRICT client validation
 * HIPAA/PHI Protection: Only allows updates to todos within the same client
 */
export const updateTodo = async (req: Request, id: number, data: TodoUpdateInput): Promise<Todo | null> => {
  try {
    const currentUser = getCurrentUser(req as any);
    
    if (!currentUser.clientId) {
      throw createAuthorizationError('Client context required for data modification');
    }

    logger.info('Updating todo with client validation', { 
      id, 
      userId: currentUser.userId,
      clientId: currentUser.clientId 
    });

    // CRITICAL: Verify todo belongs to user's client before update
    const existingTodo = await todoRepository.findTodoByIdAndClientId(id, currentUser.clientId);
    if (!existingTodo) {
      throw createAuthorizationError('Todo not found or access denied');
    }

    return todoRepository.updateTodoWithClientValidation(id, currentUser.clientId, data);
  } catch (error: any) {
    logger.error('Error updating todo:', error);
    throw error;
  }
};

/**
 * Delete todo with STRICT client validation
 * HIPAA/PHI Protection: Only allows deletion of todos within the same client
 */
export const deleteTodo = async (req: Request, id: number): Promise<Todo | null> => {
  try {
    const currentUser = getCurrentUser(req as any);
    
    if (!currentUser.clientId) {
      throw createAuthorizationError('Client context required for data deletion');
    }

    // Additional authorization for deletion
    const currentUserRole = currentUser.roles[0] || '';
    if (![CoreRole.SUPER_ADMIN, CoreRole.CLIENT_ADMIN, CoreRole.CLINICAL_STAFF, CoreRole.OFFICE_STAFF].includes(currentUserRole as CoreRole)) {
      throw createAuthorizationError('Insufficient permissions for todo deletion');
    }

    logger.info('Deleting todo with client validation', { 
      id, 
      userId: currentUser.userId,
      clientId: currentUser.clientId 
    });

    // CRITICAL: Verify todo belongs to user's client before deletion
    const existingTodo = await todoRepository.findTodoByIdAndClientId(id, currentUser.clientId);
    if (!existingTodo) {
      throw createAuthorizationError('Todo not found or access denied');
    }

    return todoRepository.deleteTodoWithClientValidation(id, currentUser.clientId);
  } catch (error: any) {
    logger.error('Error deleting todo:', error);
    throw error;
  }
};

/**
 * Mark todo as completed with STRICT client validation
 */
export const markTodoAsCompleted = async (req: Request, id: number): Promise<Todo | null> => {
  try {
    const currentUser = getCurrentUser(req as any);
    
    if (!currentUser.clientId) {
      throw createAuthorizationError('Client context required for data modification');
    }

    logger.info('Marking todo as completed with client validation', { 
      id, 
      userId: currentUser.userId,
      clientId: currentUser.clientId 
    });

    // CRITICAL: Verify todo belongs to user's client before update
    const existingTodo = await todoRepository.findTodoByIdAndClientId(id, currentUser.clientId);
    if (!existingTodo) {
      throw createAuthorizationError('Todo not found or access denied');
    }

    return todoRepository.updateTodoWithClientValidation(id, currentUser.clientId, { is_completed: true });
  } catch (error: any) {
    logger.error('Error marking todo as completed:', error);
    throw error;
  }
};
