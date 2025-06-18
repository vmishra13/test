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
    await msgGroupService.getUserGroups(req); // Updated method name
    // This will throw "not implemented" error until tables are added
  } catch (error: any) {
    console.error('Get message groups error:', error);
    if (error.message.includes('temporarily disabled')) {
      res.status(StatusCodes.NOT_IMPLEMENTED).json(
        ApiResponse.error('Message group functionality temporarily disabled - database tables not implemented')
      );
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error('Failed to retrieve message groups')
      );
    }
  }
});

/**
 * POST /msg-groups
 * Create a new message group
 */
router.post('/', authenticate, async (req, res) => {
  try {
    await msgGroupService.createGroup(req); // Updated method name
    // This will throw "not implemented" error until tables are added
  } catch (error: any) {
    console.error('Create message group error:', error);
    if (error.message.includes('temporarily disabled')) {
      res.status(StatusCodes.NOT_IMPLEMENTED).json(
        ApiResponse.error('Message group functionality temporarily disabled - database tables not implemented')
      );
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error('Failed to create message group')
      );
    }
  }
});

/**
 * GET /msg-groups/:id
 * Get a specific message group
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    await msgGroupService.getGroupDetails(req); // Updated method name
    // This will throw "not implemented" error until tables are added
  } catch (error: any) {
    console.error('Get message group error:', error);
    if (error.message.includes('temporarily disabled')) {
      res.status(StatusCodes.NOT_IMPLEMENTED).json(
        ApiResponse.error('Message group functionality temporarily disabled - database tables not implemented')
      );
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error('Failed to retrieve message group')
      );
    }
  }
});

export default router;