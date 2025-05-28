import { CorsOptions } from 'cors';
import { ENV } from './env';

/**
 * CORS configuration based on environment
 */
export const corsConfig: CorsOptions = {
  // Allow specific origins in production, any origin in development
  origin: ENV.isProduction ? ['https://relicare.com', 'https://admin.relicare.com'] : '*',

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],

  // Allowed headers in requests
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],

  // Headers exposed to the client
  exposedHeaders: ['Content-Range', 'X-Content-Range'],

  // Allow credentials (cookies/auth) only in production
  credentials: ENV.isProduction,

  // Cache preflight requests for 24 hours (in seconds)
  maxAge: 86400,
};

/**
 * CORS configuration for admin routes (stricter)
 */
export const adminCorsConfig: CorsOptions = {
  ...corsConfig,
  // Only allow admin domain for admin routes
  origin: ENV.isProduction ? 'https://admin.relicare.com' : '*',
};

/**
 * CORS configuration for public API routes (more permissive)
 */
export const publicCorsConfig: CorsOptions = {
  ...corsConfig,
  // Public endpoints can be accessed from more origins if needed
  origin: ENV.isProduction
    ? ['https://relicare.com', 'https://admin.relicare.com', 'https://public.relicare.com']
    : '*',
  // Public endpoints don't need credentials
  credentials: false,
};
