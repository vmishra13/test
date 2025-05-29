import { db } from '@db';
import logger from '@config/logger';
import { TodoCreateInput, TodoUpdateInput } from '../models/todo.model';

export const findAllTodos = async () => {
  try {
    return await db.postgres.todo.findMany({
      orderBy: { created_at: 'desc' },
    });
  } catch (error) {
    logger.error('findAllTodos error', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const findTodoById = async (id: number) => {
  try {
    return await db.postgres.todo.findUnique({
      where: { id },
    });
  } catch (error) {
    logger.error('findTodoById error', {
      id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const createTodo = async (data: TodoCreateInput) => {
  try {
    return await db.postgres.todo.create({
      data,
    });
  } catch (error) {
    logger.error('createTodo error', {
      data,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const updateTodo = async (id: number, data: TodoUpdateInput) => {
  try {
    return await db.postgres.todo.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error('updateTodo error', {
      id,
      data,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const deleteTodo = async (id: number) => {
  try {
    return await db.postgres.todo.delete({
      where: { id },
    });
  } catch (error) {
    logger.error('deleteTodo error', {
      id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
