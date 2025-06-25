import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@/shared/utils/api-response';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import { messageService } from '../services/message.service'; // ✅ Fixed: Use relative path

const router = Router();

/**
 * GET /messages/inbox
 * Get user's inbox messages
 */
router.get('/inbox', authenticate, async (req, res) => {
  try {
    await messageService.getInboxMessages(req);
    // This will throw "not implemented" error until tables are added
  } catch (error: any) {
    console.error('Get inbox messages error:', error);
    if (error.message.includes('temporarily disabled')) {
      res.status(StatusCodes.NOT_IMPLEMENTED).json(
        ApiResponse.error('Messaging functionality temporarily disabled - database tables not implemented')
      );
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error('Failed to retrieve inbox messages')
      );
    }
  }
});

/**
 * POST /messages
 * Send a new message
 */
router.post('/', authenticate, async (req, res) => {
  try {
    await messageService.sendMessage(req);
    // This will throw "not implemented" error until tables are added
  } catch (error: any) {
    console.error('Send message error:', error);
    if (error.message.includes('temporarily disabled')) {
      res.status(StatusCodes.NOT_IMPLEMENTED).json(
        ApiResponse.error('Messaging functionality temporarily disabled - database tables not implemented')
      );
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error('Failed to send message')
      );
    }
  }
});

/**
 * GET /messages/sent
 * Get user's sent messages
 */
router.get('/sent', authenticate, async (req, res) => {
  try {
    await messageService.getSentMessages(req);
    // This will throw "not implemented" error until tables are added
  } catch (error: any) {
    console.error('Get sent messages error:', error);
    if (error.message.includes('temporarily disabled')) {
      res.status(StatusCodes.NOT_IMPLEMENTED).json(
        ApiResponse.error('Messaging functionality temporarily disabled - database tables not implemented')
      );
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error('Failed to retrieve sent messages')
      );
    }
  }
});

/**
 * PUT /messages/:id/read
 * Mark a message as read
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    await messageService.markAsRead(req);
    // This will throw "not implemented" error until tables are added
  } catch (error: any) {
    console.error('Mark message as read error:', error);
    if (error.message.includes('temporarily disabled')) {
      res.status(StatusCodes.NOT_IMPLEMENTED).json(
        ApiResponse.error('Messaging functionality temporarily disabled - database tables not implemented')
      );
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error('Failed to mark message as read')
      );
    }
  }
});

/**
 * DELETE /messages/:id
 * Delete a message
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await messageService.deleteMessage(req);
    // This will throw "not implemented" error until tables are added
  } catch (error: any) {
    console.error('Delete message error:', error);
    if (error.message.includes('temporarily disabled')) {
      res.status(StatusCodes.NOT_IMPLEMENTED).json(
        ApiResponse.error('Messaging functionality temporarily disabled - database tables not implemented')
      );
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error('Failed to delete message')
      );
    }
  }
});

export default router;