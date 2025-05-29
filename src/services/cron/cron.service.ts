import * as cron from 'node-cron';
import logger from '@config/logger';

// Store active tasks so we can manage them later
const activeTasks: Map<string, cron.ScheduledTask> = new Map();

/**
 * Register a new cron job
 *
 * @param name Unique identifier for the cron job
 * @param schedule Cron schedule expression (supports seconds as first parameter)
 * @param task Function to execute when the schedule triggers
 * @param options Optional configuration options
 * @returns The scheduled task
 */
export function registerCronJob(
  name: string,
  schedule: string,
  task: () => Promise<void> | void,
  options: {
    timezone?: string;
    runOnInit?: boolean;
  } = {},
): cron.ScheduledTask {
  // Validate the cron expression
  if (!cron.validate(schedule)) {
    throw new Error(`Invalid cron expression: ${schedule}`);
  }

  // Check if a task with this name already exists
  if (activeTasks.has(name)) {
    logger.warn(`Overriding existing cron job: ${name}`);
    activeTasks.get(name)?.stop();
  }

  // Wrap the task with logging and error handling
  const wrappedTask = async () => {
    const startTime = Date.now();
    logger.info(`Cron job started: ${name}`);

    try {
      await Promise.resolve(task());

      const duration = Date.now() - startTime;
      logger.info(`Cron job completed: ${name}`, { durationMs: duration });
    } catch (error) {
      logger.error(`Cron job failed: ${name}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  // Schedule the task
  const scheduledTask = cron.schedule(schedule, wrappedTask, {
    timezone: options.timezone,
  });

  // Store the task for management
  activeTasks.set(name, scheduledTask);

  logger.info(`Cron job registered: ${name}, schedule: ${schedule}`);

  // Optionally run immediately
  if (options.runOnInit) {
    setTimeout(() => wrappedTask(), 0);
  }

  return scheduledTask;
}

/**
 * Stop a specific cron job by name
 */
export function stopCronJob(name: string): boolean {
  const task = activeTasks.get(name);
  if (task) {
    task.stop();
    activeTasks.delete(name);
    logger.info(`Cron job stopped: ${name}`);
    return true;
  }
  return false;
}

/**
 * Stop all running cron jobs
 */
export function stopAllCronJobs(): void {
  for (const [name, task] of activeTasks.entries()) {
    task.stop();
    logger.info(`Cron job stopped: ${name}`);
  }
  activeTasks.clear();
}

/**
 * Get status of all registered cron jobs
 */
export function getCronJobStatus(): Array<{
  name: string;
  schedule: string;
  status: string | Promise<string>;
}> {
  // Create a separate map to store schedules when registering jobs

  return Array.from(activeTasks.entries()).map(([name, task]) => ({
    name,
    // We should store the schedule when registering the job instead of accessing it here
    schedule: 'unknown', // Replace this with proper schedule tracking
    status: task.getStatus(),
  }));
}
