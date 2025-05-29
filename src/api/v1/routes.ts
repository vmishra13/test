import { Router } from 'express';
import { todoRouter } from '@features/todo';
// Import other feature routes as needed

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Define routes
router.use('/todos', todoRouter);
// Add other route groups as needed

export default router;
