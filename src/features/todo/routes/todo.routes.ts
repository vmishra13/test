import { Router } from 'express';
import * as todoController from '../controllers/todo.controller';

const todoRouter = Router();

// Get all todos
todoRouter.get('/', todoController.getAllTodos);

// Get a specific todo
todoRouter.get('/:id', todoController.getTodoById);

// Create a new todo
todoRouter.post('/', todoController.createTodo);

// Update a todo
todoRouter.put('/:id', todoController.updateTodo);

// Delete a todo
todoRouter.delete('/:id', todoController.deleteTodo);

// Mark a todo as completed
todoRouter.patch('/:id/complete', todoController.markTodoCompleted);

export default todoRouter;
