import logger from '../../config/logger';
import { registerCronJob } from './cron.service';
import { fiveSecondTask, oneMinuteTask } from './tasks/test-tasks';

/**
 * Register all cron jobs for the application
 */
export function registerCronJobs(): void {
  logger.info('Initializing cron jobs');

  // Test jobs for development verification
  if (process.env.NODE_ENV === 'development') {
    // Test job running every 5 seconds
    // registerCronJob(
    //   'five-second-test',
    //   '*/5 * * * * *', // Runs every 5 seconds
    //   fiveSecondTask,
    // );
    // // Test job running every minute
    // registerCronJob(
    //   'one-minute-test',
    //   '* * * * *', // Runs every minute
    //   oneMinuteTask,
    // );
  }

  // Production jobs (commented out until needed)
  /*
  // Daily appointment reminders at 8 AM
  registerCronJob(
    'appointment-reminders',
    '0 8 * * *', // At 8:00 AM every day
    async () => {
      logger.info('Sending appointment reminders for today');
      // In the future, your implementation would be:
      // await appointmentService.sendRemindersForUpcomingAppointments();
    },
  );

  // Weekly report generation every Monday at 1 AM
  registerCronJob(
    'weekly-reports',
    '0 1 * * 1', // At 1:00 AM every Monday
    async () => {
      logger.info('Generating weekly reports');
      // await reportService.generateWeeklyReports();
    },
  );

  // Database cleanup every day at 3 AM
  registerCronJob(
    'db-maintenance',
    '0 3 * * *', // At 3:00 AM every day
    async () => {
      logger.info('Running database maintenance tasks');
      // await maintenanceService.cleanupExpiredSessions();
      // await maintenanceService.optimizeDatabase();
    },
  );

  // Monthly billing processing on the 1st of every month at 2 AM
  registerCronJob(
    'monthly-billing',
    '0 2 1 * *', // At 2:00 AM on the 1st day of the month
    async () => {
      logger.info('Processing monthly billing cycle');
      // await billingService.processMonthlyBilling();
    },
  );
  */

  logger.info('Cron jobs initialized successfully');
}
