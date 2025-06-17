import authRoutes from './routes';

// Export authorization service functions
export {
  performAuthorization,
  createAuthRequest,
  getCurrentUser,
  getCurrentUserPrimaryRole,
} from './services/authorization.service';

export { authRoutes };
