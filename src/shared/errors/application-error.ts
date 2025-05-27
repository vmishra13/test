import { StatusCodes } from 'http-status-codes';

export class ApplicationError extends Error {
  constructor(
    public message: string,
    public statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found') {
    super(message, StatusCodes.NOT_FOUND, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized access') {
    super(message, StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Forbidden access') {
    super(message, StatusCodes.FORBIDDEN, 'FORBIDDEN');
  }
}

export class BadRequestError extends ApplicationError {
  constructor(message: string = 'Bad request') {
    super(message, StatusCodes.BAD_REQUEST, 'BAD_REQUEST');
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string = 'Resource conflict') {
    super(message, StatusCodes.CONFLICT, 'CONFLICT');
  }
}