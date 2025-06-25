/**
 * PLANS FEATURE INDEX
 * 
 * This file exports the plans feature routes for integration into the main API router.
 * It provides comprehensive CRUD operations for:
 * - Plans (treatment plans)
 * - Patient Plans (assigned plans)
 * - Patient Plan Schedules (scheduled activities)
 * - Patient Plan Schedule Logs (activity tracking)
 */

import plansRoutes from './routes/plans.routes';

export { plansRoutes };
export default plansRoutes;
