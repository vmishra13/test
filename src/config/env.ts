import dotenv from 'dotenv';
import path from 'path';
import { StringValue } from '../shared/types';

const environment = process.env.NODE_ENV || 'development';
const envFile =
  environment === 'production' ? '.env.production' : environment === 'test' ? '.env.test' : '.env';

// Load environment-specific variables
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Fallback to default .env if specific one doesn't exist
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Define environment configuration
export const ENV = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET ?? 'access-token-secret-dev',
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET ?? 'refresh-token-secret-dev',
    accessTokenExpiresIn: (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '15m') as StringValue,
    refreshTokenExpiresIn: (process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ?? '7d') as StringValue,
  },
  // Database configuration
  database: {
    postgres: {
      url: process.env.POSTGRES_DATABASE_URL,
    },
    mongodb: {
      url: process.env.MONGODB_DATABASE_URL,
    },
  },
  // Helper properties
  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  },
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },
  get isTest(): boolean {
    return this.nodeEnv === 'test';
  },
};

const requiredEnvVars = ['JWT_ACCESS_TOKEN_SECRET', 'JWT_REFRESH_TOKEN_SECRET'];

// In production, ensure all required vars are set
if (ENV.isProduction) {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}
