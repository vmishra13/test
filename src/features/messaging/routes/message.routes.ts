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
    const result = await messageService.getInboxMessages(req);
    
    res.status(StatusCodes.OK).json(
      ApiResponse.success(result.data, result.message)
    );
  } catch (error) {
    console.error('Get inbox messages error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve inbox messages')
    );
  }
});

/**
 * POST /messages
 * Send a new message
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const result = await messageService.sendMessage(req);

    res.status(StatusCodes.CREATED).json(
      ApiResponse.success(result.data, result.message)
    );
  } catch (error) {
    console.error('Send message error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to send message')
    );
  }
});

/**
 * GET /messages/sent
 * Get user's sent messages
 */
router.get('/sent', authenticate, async (req, res) => {
  try {
    const result = await messageService.getSentMessages(req);
    
    res.status(StatusCodes.OK).json(
      ApiResponse.success(result.data, result.message)
    );
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to retrieve sent messages')
    );
  }
});

/**
 * PUT /messages/:id/read
 * Mark a message as read
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const result = await messageService.markAsRead(req);
    
    res.status(StatusCodes.OK).json(
      ApiResponse.success(result.data, result.message)
    );
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to mark message as read')
    );
  }
});

/**
 * DELETE /messages/:id
 * Delete a message
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await messageService.deleteMessage(req);
    
    res.status(StatusCodes.OK).json(
      ApiResponse.success(result.data, result.message)
    );
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to delete message')
    );
  }
});

export default router;