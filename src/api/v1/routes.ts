import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { todoRouter } from '@features/todo';
// Import other feature routes as needed

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Define routes
router.use('/todos', todoRouter);
// Add other route groups as needed

export default router;
