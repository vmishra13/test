import logger from '../config/logger';
import { initializeServer } from './server';
import { registerProcessHandlers } from './process-handlers';
import { registerCronJobs } from '../services/cron/task-registry';
import { ENV } from '../config/env';
import { db } from '../db';

/**
 * Bootstrap application
 */
export const bootstrap = async (): Promise<void> => {
  try {
    // Register all global handlers
    registerProcessHandlers();

    // Connect to databases
    await db.connect();

    // Initialize and start the server
    await initializeServer();

    // Start all scheduled cron jobs if not in test mode
    if (ENV.nodeEnv !== 'test') {
      registerCronJobs();
      logger.info('Scheduled tasks initialized');
    }
  } catch (error) {
    logger.error('Bootstrap failure', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
};
