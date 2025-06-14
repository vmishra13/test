/**
 * Plans module exports
 */

import { Router } from 'express';
import planRoutes from './routes';

const router = Router();

// Add your plan routes here
// router.get('/', getPlanController);
// router.post('/', createPlanController);

export default router;
export { planRoutes };