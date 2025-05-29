import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@utils/api-response';
import { getCronJobStatus } from '@services/cron/cron.service';

/**
 * Get the status of all registered cron jobs
 */
export const getCronJobsStatus = (req: Request, res: Response): void => {
  const jobStatus = getCronJobStatus();

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        jobs: jobStatus,
        count: jobStatus.length,
      },
      'Cron job status retrieved successfully',
    ),
  );
};
