import { Request, Response } from 'express';
import * as todoController  from '../controllers/todo.controller';
import * as todoService from '../services/todo.service';
import { Todo, TodoUpdateInput } from '../models/todo.model';

jest.mock('../services/todo.service');

describe('Todo Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
 

  beforeEach(() => {
    jest.clearAllMocks();
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    req = { body: {}, params: {}, query: {} };
    res = { status: statusMock, json: jsonMock };
  
  });


  describe('createTodo', () => {
    it('should create todo successfully', async () => {
      const mockTodos =         
        {id: 1, title: 'Test Todo', description: 'Test Desc', is_completed: false, created_at: new Date(), }
      const todoData = { title: 'Test Todo', description: 'Test Description' };
      (todoService.createTodo as jest.Mock).mockResolvedValue(mockTodos);
      req.body = todoData;

      await todoController.createTodo(req as Request, res as Response);

      expect(todoService.createTodo).toHaveBeenCalledWith(todoData);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Todo created successfully',
        data: mockTodos,
        apiVersion: 'v1',
        timestamp: expect.any(String)
      });
    });

    it('should handle 500 error', async () => {
      const error = new Error('Create failed');
      (todoService.createTodo as jest.Mock).mockRejectedValue(error);
      req.body = { title: 'fail' };

      await todoController.createTodo(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to create todo',
           code: 'INTERNAL_SERVER_ERROR',
           data: null,
           apiVersion: 'v1',
          timestamp: expect.any(String)
        }) 
      );
  });

  it('should handle VALIDATION_ERROR error', async () => {
      req.body = { title: '' }; // Missing required field
      await todoController.createTodo(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Title is required',
          code: 'VALIDATION_ERROR',
          data: null,
          apiVersion: 'v1',
          timestamp: expect.any(String)
        })
      );
    });

describe('getAllTodos', () => {
    it('should get all todos', async () => {
      const mockTodos = [
        { id: 1, title: 'Test Todo', description: 'Test Desc', is_completed: false, created_at: new Date() },
        { id: 2, title: 'Another Todo', description: 'Another Desc', is_completed: true, created_at: new Date()}
      ];
      
      (todoService.getAllTodos as jest.Mock).mockResolvedValue(mockTodos);

      await todoController.getAllTodos(req as Request, res as Response);

      expect(todoService.getAllTodos).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully retrieved todos',
        data: mockTodos,
        apiVersion: 'v1',
        timestamp: expect.any(String)
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Get failed');
      (todoService.getAllTodos as jest.Mock).mockRejectedValue(error);

      await todoController.getAllTodos(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to retrieve todos',
        })
      );   
    });


    describe('getTodoById', () => {
      it('should return todo by id', async () => {
        const mockTodo = { id: 1, title: 'Test Todo', description: 'Test Desc', is_completed: false, created_at: new Date() };
        (todoService.getTodoById as jest.Mock).mockResolvedValue(mockTodo);
        req.params = { id: '1' };

        await todoController.getTodoById(req as Request, res as Response);
        expect(todoService.getTodoById).toHaveBeenCalledWith(1);
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          success: true,
          message: 'Successfully retrieved todo',
          data: mockTodo,
          apiVersion: 'v1',
          timestamp: expect.any(String)
        });
      });
      it('should handle todo not found', async () => {
        (todoService.getTodoById as jest.Mock).mockResolvedValue(null);
        req.params = { id: '1' };

        await todoController.getTodoById(req as Request, res as Response);
        expect(todoService.getTodoById).toHaveBeenCalledWith(1);
        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          message: 'Todo not found',
          code: 'NOT_FOUND',
          apiVersion: 'v1',
          data: null,
          timestamp: expect.any(String)
        });
      });

      it('should handle errors', async () => {
        const error = new Error('Get by id failed');
        (todoService.getTodoById as jest.Mock).mockRejectedValue(error);
        req.params = { id: '1' };

        await todoController.getTodoById(req as Request, res as Response);
        expect(todoService.getTodoById).toHaveBeenCalledWith(1);
        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Failed to retrieve todo',
            code: 'INTERNAL_SERVER_ERROR',
            apiVersion: 'v1',
            timestamp: expect.any(String)
          })
        );
      });
      it('should handle invalid id format', async () => {
        req.params = { id: 'invalid' };

        await todoController.getTodoById(req as Request, res as Response);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Invalid todo ID format',
            code: 'INVALID_ID',
            apiVersion: 'v1',
            timestamp: expect.any(String)
          })
        );
      });
    });

 describe('updateTodo', () => {
  it('should handle error when updating todo', async () => {
    const error = new Error('Update failed');
    (todoService.updateTodo as jest.Mock).mockRejectedValue(error);
    req.params = { id: '1' };
    req.body = { title: 'Updated Todo', description: 'Updated Desc', is_completed: true };

    await todoController.updateTodo(
      req as Request<{ id: string }, {}, TodoUpdateInput>,
      res as Response
    );

    expect(todoService.updateTodo).toHaveBeenCalledWith(1, req.body);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Failed to update todo',
        code: 'INTERNAL_SERVER_ERROR',
        apiVersion: 'v1',
        timestamp: expect.any(String)
      })
    );
  });
  it('should handle todo not found', async () => {
    (todoService.updateTodo as jest.Mock).mockResolvedValue(null);
    req.params = { id: '1' };
    req.body = { title: 'Updated Todo', description: 'Updated Desc', is_completed: true };

    await todoController.updateTodo(
      req as Request<{ id: string }, {}, TodoUpdateInput>,
      res as Response
    );

    expect(todoService.updateTodo).toHaveBeenCalledWith(1, req.body);
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: 'Todo not found',
      code: 'NOT_FOUND',
      apiVersion: 'v1',
      data: null,
      details:404,
      timestamp: expect.any(String)
    });
  });
  it('should handle internal server error', async () => {
    const error = new Error('Internal server error');
    (todoService.updateTodo as jest.Mock).mockRejectedValue(error);
    req.params = { id: '1' };
    req.body = { title: 'Updated Todo', description: 'Updated Desc', is_completed: true };

    await todoController.updateTodo(
      req as Request<{ id: string }, {}, TodoUpdateInput>,
      res as Response
    );

    expect(todoService.updateTodo).toHaveBeenCalledWith(1, req.body);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Failed to update todo',
        code: 'INTERNAL_SERVER_ERROR',
        apiVersion: 'v1',
        timestamp: expect.any(String)
      })
    );
  });
});
describe('deleteTodo', () => {
  it('should handle invalid todo ID format', async () => {
    req.params = { id: 'invalid' };

    await todoController.deleteTodo(req as Request, res as Response);
    expect(todoService.deleteTodo).not.toHaveBeenCalledWith();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Invalid todo ID format',
        code: 'INVALID_ID',
        apiVersion: 'v1',
        timestamp: expect.any(String)
      })
    );
  });
  /*
  it('should handle todo not found', async () => {
    (todoService.deleteTodo as jest.Mock).mockResolvedValue(null);
    req.params = { id: '1' };

    await todoController.deleteTodo(req as Request, res as Response);

    expect(todoService.deleteTodo).not.toHaveBeenCalledWith();
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: 'Todo not found',
      code: 'NOT_FOUND',
      statusCode: 404,
      apiVersion: 'v1',
      timestamp: expect.any(String)
    });
  });
*/
  it('should handle internal server error', async () => {
    const error = new Error('Delete failed');
    (todoService.deleteTodo as jest.Mock).mockRejectedValue(error);
    req.params = { id: '1' };

    await todoController.deleteTodo(req as Request, res as Response);

    expect(todoService.deleteTodo).not.toHaveBeenCalledWith();
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Failed to delete todo',
        code: 'INTERNAL_SERVER_ERROR',
        apiVersion: 'v1',
        timestamp: expect.any(String)
      })
    );
  });
});
describe('markTodoCompleted', () => {
  it('should handle invalid todo ID format', async () => {
    req.params = { id: 'invalid' };

    await todoController.markTodoCompleted(req as Request, res as Response);
    expect(todoService.markTodoAsCompleted).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Invalid todo ID format',
        code: 'INVALID_ID',
        apiVersion: 'v1',
        timestamp: expect.any(String)
      })
    );
  });
  /*
  it('should handle todo not found', async () => {
    (todoService.markTodoAsCompleted as jest.Mock).mockResolvedValue(null);
    req.params = { id: '1' };

    await todoController.markTodoCompleted(req as Request, res as Response);

    expect(todoService.markTodoAsCompleted).not.toHaveBeenCalledWith();
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: 'Todo not found',
      code: 'NOT_FOUND',
      statusCode: 404,
      apiVersion: 'v1',
      timestamp: expect.any(String)
    });
  });
*/
  it('should handle internal server error', async () => {
    const error = new Error('Mark as completed failed');
    (todoService.markTodoAsCompleted as jest.Mock).mockRejectedValue(error);
    req.params = { id: '1' };

    await todoController.markTodoCompleted(req as Request, res as Response);

    expect(todoService.markTodoAsCompleted).not.toHaveBeenCalledWith();
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Failed to mark todo as completed',
        code: 'INTERNAL_SERVER_ERROR',
        apiVersion: 'v1',
        timestamp: expect.any(String)
      })
    );
  });
});
});
});
});
