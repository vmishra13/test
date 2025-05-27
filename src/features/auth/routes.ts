import { Router } from 'express';
import { authController } from './controllers/auth.controller';

const router = Router();

// OAuth 2.0 standard endpoints
router.post('/token', authController.token); // For both login and refresh token flows
router.post('/revoke', authController.revoke); // For logout (revoking tokens)
router.post('/register', authController.register); // Not strictly OAuth but common extension

// Advanced OAuth features (optional)
// router.get('/authorize', authController.authorize);   // Authorization code flow start
// router.post('/introspect', authController.introspect); // Token validation/inspection

export default router;
