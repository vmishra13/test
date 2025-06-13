import { Router } from 'express';
import { authenticate } from '@features/auth/middlewares';
import { registerUserController } from './controllers/registration.controller';
import { getUsersController } from './controllers/user.controller';

const router = Router();

// Core registration endpoints
router.post('/register', authenticate, registerUserController as any);

// Core user management endpoints
router.get('/', authenticate, getUsersController as any);

export default router;
