import * as todoRepository from '../repositories/todo.repository';
import * as todoService from '../services/todo.service';
// import logger from '@config/logger';
import { Todo, TodoCreateInput, TodoUpdateInput } from '../models/todo.model';
// import { Mock } from 'jest-mock';
  

jest.mock('../repositories/todo.repository');
// jest.mock('@config/logger');

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTodos', () => {
    it('should return all todos', async () => {
      const mockTodos = [        
        {id: 1, title: 'Test Todo', description: 'Test Desc', is_completed: false, created_at: new Date()}
      ];
      (todoRepository.findAllTodos as jest.Mock).mockResolvedValue([mockTodos]);
      const result = await todoService.getAllTodos();
      expect(result).toEqual([mockTodos]);
      expect(todoRepository.findAllTodos).toHaveBeenCalled();
    });
  });
 
    it('should return a todo by id', async () => {
       const mockTodos = [        
       {id: 1, title: 'Test Todo', description: 'Test Desc', is_completed: false, created_at: new Date()},
       {id: 2, title: 'Test Todo', description: 'Test Desc', is_completed: false, created_at: new Date()}
       ];
      (todoRepository.findTodoById as jest.Mock).mockResolvedValue(mockTodos);
      const result = await todoService.getTodoById(1);
      expect(result).toEqual(mockTodos);
      expect(todoRepository.findTodoById).toHaveBeenCalledWith(1);
    });

    it('should create and return a new todo', async () => {
       const mockTodos =         
        {id: 1, title: 'Test Todo', description: 'Test Desc', is_completed: false, created_at: new Date()}
      const input: TodoCreateInput = { title: 'Test Todo', description: 'Test Desc' };
      (todoRepository.createTodo as jest.Mock).mockResolvedValue(mockTodos);
      const result = await todoService.createTodo(input);
      expect(result).toEqual(mockTodos);
      expect(todoRepository.createTodo).toHaveBeenCalledWith(input);
    });
  
    it('should update and return the todo', async () => {
      const updateInput: TodoUpdateInput = { title: 'Updated', description: 'Test Desc', is_completed: true };
      const updatedTodo = { id: 1, ...updateInput, created_at: new Date() };
      (todoRepository.updateTodo as jest.Mock).mockResolvedValue(updatedTodo);
      const result = await todoService.updateTodo(1, updateInput);
      expect(result).toEqual(updatedTodo);
      expect(todoRepository.updateTodo).toHaveBeenCalledWith(1, updateInput);
    });

    it('should delete and return the todo', async () => {
      const mockTodo = { id: 1, title: 'Test Todo', description: 'Test Desc', is_completed: false, created_at: new Date() };
      (todoRepository.deleteTodo as jest.Mock).mockResolvedValue(mockTodo);
      const result = await todoService.deleteTodo(1);
      expect(result).toEqual(mockTodo);
      expect(todoRepository.deleteTodo).toHaveBeenCalledWith(1);
    });

    it('should mark todo as completed', async () => {
        const mockTodo = { id: 1, title: 'Test Todo', description: 'Test Desc', is_completed: false, created_at: new Date() };
        (todoRepository.updateTodo as jest.Mock).mockResolvedValue({ ...mockTodo, is_completed: true });
        const result = await todoService.markTodoAsCompleted(1);
        expect(result).toEqual({ ...mockTodo, is_completed: true });
        expect(todoRepository.updateTodo).toHaveBeenCalledWith(1, { is_completed: true });
    });



