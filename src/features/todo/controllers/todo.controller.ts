import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as todoService from '../services/todo.service';
import { ApiResponse } from '@utils/api-response';
import logger from '@config/logger';
import type { TodoCreateInput, TodoUpdateInput } from '../models/todo.model';

export const getAllTodos = async (req: Request, res: Response): Promise<void> => {
  try {
    const todos = await todoService.getAllTodos();

    res.status(StatusCodes.OK).json(ApiResponse.success(todos, 'Successfully retrieved todos'));
  } catch (error) {
    logger.error('Error fetching todos', {
      error: error instanceof Error ? error.message : String(error),
    });

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error('Failed to retrieve todos', 'INTERNAL_SERVER_ERROR'));
  }
};

export const getTodoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const todoId = parseInt(req.params.id);

    if (isNaN(todoId)) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(ApiResponse.error('Invalid todo ID format', 'INVALID_ID'));
      return;
    }

    const todo = await todoService.getTodoById(todoId);

    if (!todo) {
      res.status(StatusCodes.NOT_FOUND).json(ApiResponse.error('Todo not found', 'NOT_FOUND'));
      return;
    }

    res.status(StatusCodes.OK).json(ApiResponse.success(todo, 'Successfully retrieved todo'));
  } catch (error) {
    logger.error('Error fetching todo by id', {
      id: req.params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        ApiResponse.error(
          'Failed to retrieve todo',
          'INTERNAL_SERVER_ERROR',
          StatusCodes.INTERNAL_SERVER_ERROR,
        ),
      );
  }
};

export const createTodo = async (
  req: Request<{}, {}, TodoCreateInput>,
  res: Response,
): Promise<void> => {
  try {
    const { title, description } = req.body;

    if (!title) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(ApiResponse.error('Title is required', 'VALIDATION_ERROR'));
      return;
    }

    const newTodo = await todoService.createTodo({ title, description });

    res.status(StatusCodes.CREATED).json(ApiResponse.success(newTodo, 'Todo created successfully'));
  } catch (error) {
    logger.error('Error creating todo', {
      data: req.body,
      error: error instanceof Error ? error.message : String(error),
    });

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error('Failed to create todo', 'INTERNAL_SERVER_ERROR'));
  }
};

export const updateTodo = async (
  req: Request<{ id: string }, {}, TodoUpdateInput>,
  res: Response,
): Promise<void> => {
  try {
    const todoId = parseInt(req.params.id);

    if (isNaN(todoId)) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(ApiResponse.error('Invalid todo ID format', 'INVALID_ID'));
      return;
    }

    const updatedTodo = await todoService.updateTodo(todoId, req.body);

    if (!updatedTodo) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json(ApiResponse.error('Todo not found', 'NOT_FOUND', StatusCodes.NOT_FOUND));
      return;
    }

    res.status(StatusCodes.OK).json(ApiResponse.success(updatedTodo, 'Todo updated successfully'));
  } catch (error) {
    logger.error('Error updating todo', {
      id: req.params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error('Failed to update todo', 'INTERNAL_SERVER_ERROR'));
  }
};

export const deleteTodo = async (req: Request, res: Response): Promise<void> => {
  try {
    const todoId = parseInt(req.params.id);

    if (isNaN(todoId)) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(ApiResponse.error('Invalid todo ID format', 'INVALID_ID'));
      return;
    }

    // Check if todo exists
    const existingTodo = await todoService.getTodoById(todoId);
    if (!existingTodo) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json(ApiResponse.error('Todo not found', 'NOT_FOUND', StatusCodes.NOT_FOUND));
      return;
    }

    await todoService.deleteTodo(todoId);

    res.status(StatusCodes.OK).json(ApiResponse.success(null, 'Todo deleted successfully'));
  } catch (error) {
    logger.error('Error deleting todo', {
      id: req.params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error('Failed to delete todo', 'INTERNAL_SERVER_ERROR'));
  }
};

export const markTodoCompleted = async (req: Request, res: Response): Promise<void> => {
  try {
    const todoId = parseInt(req.params.id);

    if (isNaN(todoId)) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json(ApiResponse.error('Invalid todo ID format', 'INVALID_ID'));
      return;
    }

    // Check if todo exists
    const existingTodo = await todoService.getTodoById(todoId);
    if (!existingTodo) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json(ApiResponse.error('Todo not found', 'NOT_FOUND', StatusCodes.NOT_FOUND));
      return;
    }

    const updatedTodo = await todoService.markTodoAsCompleted(todoId);

    res.status(StatusCodes.OK).json(ApiResponse.success(updatedTodo, 'Todo marked as completed'));
  } catch (error) {
    logger.error('Error marking todo as completed', {
      id: req.params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        ApiResponse.error(
          'Failed to mark todo as completed',
          'INTERNAL_SERVER_ERROR',
          StatusCodes.INTERNAL_SERVER_ERROR,
        ),
      );
  }
};
