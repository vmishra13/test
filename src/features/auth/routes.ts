import { Router } from 'express';
import {
  login,
  oauth2Token,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  // registerUserController
} from './controllers';
import { authenticate } from './middlewares';

const router = Router();

// ===================================================================
// 🔐 OAUTH 2.0 & AUTHENTICATION ROUTES
// ===================================================================

// OAuth 2.0 compatible endpoints
router.post('/login', login); // OAuth 2.0 password grant (legacy compatibility)
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);

router.post('/token', oauth2Token); // Standard OAuth 2.0 token endpoint
router.post('/revoke', authenticate, logout); // OAuth 2.0 revocation endpoint

// Password reset endpoints
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

export default router;
