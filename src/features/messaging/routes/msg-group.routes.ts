import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@/shared/utils/api-response';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import { msgGroupService } from '../services/msg-group.service';

const router = Router();

/**
 * GET /msg-groups
 * List message groups for a client
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await msgGroupService.getMessageGroups(req);
    
    res.status(StatusCodes.OK).json(
      ApiResponse.success(result.data, result.message)
    );
  } catch (error) {
    console.error('Get message groups error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve message groups')
    );
  }
});

/**
 * POST /msg-groups
 * Create a new message group
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const result = await msgGroupService.createMessageGroup(req);

    res.status(StatusCodes.CREATED).json(
      ApiResponse.success(result.data, result.message)
    );
  } catch (error) {
    console.error('Create message group error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to create message group')
    );
  }
});

/**
 * GET /msg-groups/:id
 * Get a specific message group
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await msgGroupService.getMessageGroup(req);

    res.status(StatusCodes.OK).json(
      ApiResponse.success(result.data, result.message)
    );
  } catch (error) {
    console.error('Get message group error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve message group')
    );
  }
});

export default router;