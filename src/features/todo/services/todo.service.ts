import * as todoRepository from '../repositories/todo.repository';
import logger from '@config/logger';
import { TodoCreateInput, TodoUpdateInput, Todo } from '../models/todo.model';

export const getAllTodos = async (): Promise<Todo[]> => {
  logger.info('Getting all todos');
  return todoRepository.findAllTodos();
};

export const getTodoById = async (id: number): Promise<Todo | null> => {
  logger.info('Getting todo by ID', { id });
  return todoRepository.findTodoById(id);
};

export const createTodo = async (data: TodoCreateInput): Promise<Todo> => {
  logger.info('Creating new todo', { title: data.title });
  return todoRepository.createTodo(data);
};

export const updateTodo = async (id: number, data: TodoUpdateInput): Promise<Todo | null> => {
  logger.info('Updating todo', { id });
  return todoRepository.updateTodo(id, data);
};

export const deleteTodo = async (id: number): Promise<Todo | null> => {
  logger.info('Deleting todo', { id });
  return todoRepository.deleteTodo(id);
};

export const markTodoAsCompleted = async (id: number): Promise<Todo | null> => {
  logger.info('Marking todo as completed', { id });
  return todoRepository.updateTodo(id, { is_completed: true });
};
