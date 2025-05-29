import logger from '@config/logger';

/**
 * Test task that runs every 5 seconds
 * This is for verification purposes only
 */
export async function fiveSecondTask(): Promise<void> {
  const timestamp = new Date().toISOString();
  logger.info(`5-second test task executed at ${timestamp}`, {
    taskType: 'high-frequency',
    timestamp,
  });
}

/**
 * Test task that runs every minute
 * This is for verification purposes only
 */
export async function oneMinuteTask(): Promise<void> {
  const timestamp = new Date().toISOString();
  logger.info(`1-minute test task executed at ${timestamp}`, {
    taskType: 'normal-frequency',
    timestamp,
  });
}
