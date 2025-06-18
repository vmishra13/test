import request from 'supertest';
import app from '../../app';
import * as todoRepository from './repositories/todo.repository';
import { Todo } from './models/todo.model';

// Mock the entire todo repository module
jest.mock('./repositories/todo.repository');

// Mock the database connection
jest.mock('../../db', () => ({
  postgres: {
    todo: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }
  },
  mongodb: {
    // Add MongoDB mocks if needed
  }
}));

// Type the mocked repository for better TypeScript support
const mockedTodoRepository = todoRepository as jest.Mocked<typeof todoRepository>;

describe('Todo Integration Tests', () => {
  // Mock data
  const mockTodos: Todo[] = [
    {
      id: 1,
      title: 'Mock Todo 1',
      description: 'This is a mock todo',
      is_completed: false,
      created_at: new Date('2025-01-01')
    },
    {
      id: 2,
      title: 'Mock Todo 2',
      description: 'Another mock todo',
      is_completed: true,
      created_at: new Date('2025-01-02')
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/v1/todos', () => {
    it('should create a new todo successfully', async () => {
      const newTodo = {
        title: 'Test Todo',
        description: 'This is a test todo item',
      };

      const createdTodo: Todo = {
        id: 3,
        title: newTodo.title,
        description: newTodo.description,
        is_completed: false,
        created_at: new Date()
      };

      // Mock the repository function
      mockedTodoRepository.createTodo.mockResolvedValue(createdTodo);

      const response = await request(app)
        .post('/api/v1/todos')
        .send(newTodo)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(newTodo.title);
      expect(response.body.data.description).toBe(newTodo.description);
      expect(response.body.data.is_completed).toBe(false);

      // Verify the repository was called with correct parameters
      expect(mockedTodoRepository.createTodo).toHaveBeenCalledWith({
        title: newTodo.title,
        description: newTodo.description
      });
    });

    it('should handle validation errors', async () => {
      const invalidTodo = {
        description: 'Missing title',
      };

      const response = await request(app)
        .post('/api/v1/todos')
        .send(invalidTodo)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      
      // Ensure repository was not called for invalid data
      expect(mockedTodoRepository.createTodo).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const newTodo = {
        title: 'Test Todo',
        description: 'This will fail',
      };

      // Mock repository to throw an error
      mockedTodoRepository.createTodo.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/v1/todos')
        .send(newTodo)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('GET /api/v1/todos', () => {
    it('should retrieve all todos successfully', async () => {
      // Mock the repository function
      mockedTodoRepository.findAllTodos.mockResolvedValue(mockTodos);

      const response = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].title).toBe('Mock Todo 1');
      expect(response.body.data[1].title).toBe('Mock Todo 2');

      // Verify the repository was called
      expect(mockedTodoRepository.findAllTodos).toHaveBeenCalledTimes(1);
    });

    it('should handle empty todo list', async () => {
      // Mock empty array
      mockedTodoRepository.findAllTodos.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should handle database errors', async () => {
      // Mock repository to throw an error
      mockedTodoRepository.findAllTodos.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/v1/todos')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('GET /api/v1/todos/:id', () => {
    it('should retrieve a specific todo', async () => {
      const todoId = 1;
      const mockTodo = mockTodos[0];

      mockedTodoRepository.findTodoById.mockResolvedValue(mockTodo);

      const response = await request(app)
        .get(`/api/v1/todos/${todoId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(todoId);
      expect(response.body.data.title).toBe(mockTodo.title);

      expect(mockedTodoRepository.findTodoById).toHaveBeenCalledWith(todoId);
    });

    it('should handle todo not found', async () => {
      const todoId = 999;

      mockedTodoRepository.findTodoById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/todos/${todoId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should handle invalid ID format', async () => {
      const response = await request(app)
        .get('/api/v1/todos/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_ID');
      
      // Repository should not be called for invalid ID
      expect(mockedTodoRepository.findTodoById).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/v1/todos/:id', () => {
    it('should update a todo successfully', async () => {
      const todoId = 1;
      const updateData = {
        title: 'Updated Todo',
        description: 'Updated description',
        is_completed: true
      };

      const updatedTodo: Todo = {
        id: todoId,
        ...updateData,
        created_at: new Date()
      };

      mockedTodoRepository.updateTodo.mockResolvedValue(updatedTodo);

      const response = await request(app)
        .put(`/api/v1/todos/${todoId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.is_completed).toBe(true);

      expect(mockedTodoRepository.updateTodo).toHaveBeenCalledWith(todoId, updateData);
    });

    it('should handle todo not found during update', async () => {
      const todoId = 999;
      const updateData = { title: 'Updated Todo' };

      mockedTodoRepository.updateTodo.mockResolvedValue(undefined as any);

      const response = await request(app)
        .put(`/api/v1/todos/${todoId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/todos/:id/complete', () => {
    it('should handle Invalid todo ID format', async () => {
      
        const response = await request(app)
            .patch('/api/v1/todos/invalid-id/complete')
            .expect(400);
    
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('INVALID_ID');
    
        // Repository should not be called for invalid ID
        expect(mockedTodoRepository.updateTodo).not.toHaveBeenCalled();
  });
    });
});