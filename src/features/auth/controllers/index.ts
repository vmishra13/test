// Import all controller functions that actually exist
import {
  login,
  oauth2Token,
  refreshToken,
  logout,
  logoutAll,
  getSession,
  validateToken,
  checkAuth,
} from './auth.controller';

// Import registration controllers
// import {
// registerUserController,
// validateRegistrationController,
// getRegistrationStatsController,
// getAvailableRolesController,
// checkRegistrationPermissionsController,
// registrationHealthController,
// } from './registration.controller';

// ===================================================================
// 🔐 AUTHENTICATION EXPORTS
// ===================================================================

// Export individual auth functions for direct import
export {
  // Authentication endpoints
  login, // Legacy OAuth 2.0 password grant
  oauth2Token,
  refreshToken,
  logout,
  logoutAll,

  // Session management
  getSession,
  validateToken,
  checkAuth,
};

// ===================================================================
// 👥 REGISTRATION EXPORTS
// ===================================================================

// Export individual registration functions for direct import
// export {
//   registerUserController,
// validateRegistrationController,
// getRegistrationStatsController,
// getAvailableRolesController,
// checkRegistrationPermissionsController,
// registrationHealthController,
// };

// ===================================================================
// 📦 GROUPED EXPORTS
// ===================================================================

// Export as grouped object for structured access
export const authController = {
  // Authentication
  login, // Legacy OAuth 2.0 password grant
  oauth2Token,
  refreshToken,
  logout,
  logoutAll,

  // Session management
  getSession,
  validateToken,
  checkAuth,
} as const;

// Export registration controllers as grouped object
// export const registrationController = {
//   register: registerUserController,
//   // validate: validateRegistrationController,
//   // getStats: getRegistrationStatsController,
//   // getAvailableRoles: getAvailableRolesController,
//   // checkPermissions: checkRegistrationPermissionsController,
//   // health: registrationHealthController,
// } as const;

// Combined controller object
export const controllers = {
  auth: authController,
  // registration: registrationController,
} as const;

// Default export for convenience
export default controllers;

// ===================================================================
// 🏷️ TYPE DEFINITIONS
// ===================================================================

// Type definitions for better IntelliSense
export type AuthController = typeof authController;
// export type RegistrationController = typeof registrationController;
export type Controllers = typeof controllers;

// ===================================================================
// 📋 ENDPOINT METADATA
// ===================================================================

// Function categories for documentation
export const authEndpoints = {
  public: ['login', 'oauth2Token', 'checkAuth'],
  protected: ['refreshToken', 'logout', 'logoutAll', 'getSession', 'validateToken'],
  oauth2: ['oauth2Token', 'refreshToken', 'logout'],
} as const;

export const registrationEndpoints = {
  protected: [
    'registerUserController',
    'validateRegistrationController',
    'getRegistrationStatsController',
    'getAvailableRolesController',
    'checkRegistrationPermissionsController',
  ],
  public: ['registrationHealthController'],
} as const;

// Combined endpoint metadata for route generation
export const endpointMetadata = {
  // Auth endpoints
  login: {
    method: 'POST',
    path: '/login',
    auth: false,
    description: 'OAuth 2.0 password grant (legacy compatibility)',
    controller: 'auth',
  },
  oauth2Token: {
    method: 'POST',
    path: '/token',
    auth: false,
    description: 'Standard OAuth 2.0 token endpoint',
    controller: 'auth',
  },
  refreshToken: {
    method: 'POST',
    path: '/refresh',
    auth: false,
    description: 'Refresh access token using refresh token',
    controller: 'auth',
  },
  logout: {
    method: 'POST',
    path: '/logout',
    auth: true,
    description: 'Logout from current device',
    controller: 'auth',
  },
  logoutAll: {
    method: 'POST',
    path: '/logout-all',
    auth: true,
    description: 'Logout from all devices',
    controller: 'auth',
  },
  getSession: {
    method: 'GET',
    path: '/session',
    auth: true,
    description: 'Get current session information',
    controller: 'auth',
  },
  validateToken: {
    method: 'POST',
    path: '/validate',
    auth: true,
    description: 'Validate current access token',
    controller: 'auth',
  },
  checkAuth: {
    method: 'GET',
    path: '/check',
    auth: false,
    description: 'Check authentication status (optional auth)',
    controller: 'auth',
  },

  // Registration endpoints
  registerUserController: {
    method: 'POST',
    path: '/register',
    auth: true,
    description: 'Register a new user',
    controller: 'registration',
  },
  validateRegistrationController: {
    method: 'POST',
    path: '/register/validate',
    auth: true,
    description: 'Validate registration data before submission',
    controller: 'registration',
  },
  getRegistrationStatsController: {
    method: 'GET',
    path: '/register/stats',
    auth: true,
    description: 'Get registration statistics',
    controller: 'registration',
  },
  getAvailableRolesController: {
    method: 'GET',
    path: '/register/available-roles',
    auth: true,
    description: 'Get available roles for registration',
    controller: 'registration',
  },
  checkRegistrationPermissionsController: {
    method: 'POST',
    path: '/register/check-permissions',
    auth: true,
    description: 'Check registration permissions for specific roles',
    controller: 'registration',
  },
  registrationHealthController: {
    method: 'GET',
    path: '/register/health',
    auth: false,
    description: 'Health check for registration service',
    controller: 'registration',
  },
} as const;

// ===================================================================
// 🔧 HELPER FUNCTIONS
// ===================================================================

// Helper for route generation
// export const createRoutes = () => {
//   return Object.entries(endpointMetadata).map(([functionName, config]) => ({
//     ...config,
//     functionName,
//     handler:
//       config.controller === 'auth'
//         ? authController[functionName as keyof typeof authController]
//         : registrationController[functionName as keyof typeof registrationController],
//   }));
// };

// Get endpoints by controller type
export const getEndpointsByController = (controllerType: 'auth' | 'registration') => {
  return Object.entries(endpointMetadata)
    .filter(([, config]) => config.controller === controllerType)
    .map(([functionName, config]) => ({ functionName, ...config }));
};

// Get protected vs public endpoints
export const getEndpointsByAuth = (requiresAuth: boolean) => {
  return Object.entries(endpointMetadata)
    .filter(([, config]) => config.auth === requiresAuth)
    .map(([functionName, config]) => ({ functionName, ...config }));
};
