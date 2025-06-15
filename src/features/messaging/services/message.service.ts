import { Request } from 'express';
import { prismaPostgres } from '@/db/postgres/client';
import { createValidationError, createAuthorizationError } from '@/shared/errors/application-error';
import logger from '@/config/logger';

export const messageService = {
  /**
   * Get user's inbox messages
   */
  async getInboxMessages(req: Request) {
    try {
      const user = (req as any).user;
      const { page = 1, limit = 20 } = req.query;

      const messages = await prismaPostgres.user_msg_box.findMany({
        where: {
          userId: user.id,
          clientId: user.clientId,
          inboxFlag: true,
          deleteFlag: false
        },
        include: {
          message: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          crDate: 'desc'
        },
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit)
      });

      const total = await prismaPostgres.user_msg_box.count({
        where: {
          userId: user.id,
          clientId: user.clientId,
          inboxFlag: true,
          deleteFlag: false
        }
      });

      return {
        data: {
          messages: messages.map(msgBox => ({
            id: msgBox.id,
            messageId: msgBox.message.id,
            subject: msgBox.message.subject,
            content: msgBox.message.content,
            sender: msgBox.message.user,
            readFlag: msgBox.readFlag,
            receivedDate: msgBox.crDate
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        },
        message: 'Inbox messages retrieved successfully'
      };
    } catch (error) {
      logger.error('Error getting inbox messages:', error);
      throw error;
    }
  },

  /**
   * Get user's sent messages
   */
  async getSentMessages(req: Request) {
    try {
      const user = (req as any).user;
      const { page = 1, limit = 20 } = req.query;

      const messages = await prismaPostgres.user_msg_box.findMany({
        where: {
          userId: user.id,
          clientId: user.clientId,
          sentFlag: true,
          deleteFlag: false
        },
        include: {
          message: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          crDate: 'desc'
        },
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit)
      });

      const total = await prismaPostgres.user_msg_box.count({
        where: {
          userId: user.id,
          clientId: user.clientId,
          sentFlag: true,
          deleteFlag: false
        }
      });

      return {
        data: {
          messages: messages.map(msgBox => ({
            id: msgBox.id,
            messageId: msgBox.message.id,
            subject: msgBox.message.subject,
            content: msgBox.message.content,
            recipients: [], // You might want to fetch recipients separately
            sentDate: msgBox.crDate
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        },
        message: 'Sent messages retrieved successfully'
      };
    } catch (error) {
      logger.error('Error getting sent messages:', error);
      throw error;
    }
  },

  /**
   * Send a new message
   */
  async sendMessage(req: Request) {
    try {
      const { subject, content, recipientIds } = req.body;
      const user = (req as any).user;

      if (!content || !recipientIds || !Array.isArray(recipientIds)) {
        throw createValidationError('Missing required fields', [
          { field: 'content', message: 'Message content is required' },
          { field: 'recipientIds', message: 'Recipients are required' }
        ]);
      }

      const message = await prismaPostgres.$transaction(async (tx) => {
        // Create the message
        const newMessage = await tx.message.create({
          data: {
            userId: user.id,
            clientId: user.clientId,
            subject: subject || '',
            content,
            validFrom: new Date(),
            perView: true,
            perWrite: false,
            perReply: true,
            crUser: user.id.toString(),
            modUser: user.id.toString()
          }
        });

        // Create message box entry for sender (sent)
        await tx.user_msg_box.create({
          data: {
            userId: user.id,
            clientId: user.clientId,
            msgId: newMessage.id,
            sentFlag: true,
            validFrom: new Date(),
            perView: true,
            perWrite: false,
            perReply: false,
            crUser: user.id.toString(),
            modUser: user.id.toString()
          }
        });

        // Create message box entries for recipients (inbox)
        await tx.user_msg_box.createMany({
          data: recipientIds.map((recipientId: number) => ({
            userId: recipientId,
            clientId: user.clientId,
            msgId: newMessage.id,
            inboxFlag: true,
            validFrom: new Date(),
            perView: true,
            perWrite: false,
            perReply: true,
            crUser: user.id.toString(),
            modUser: user.id.toString()
          }))
        });

        return newMessage;
      });

      return {
        data: message,
        message: 'Message sent successfully'
      };
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Mark a message as read
   */
  async markAsRead(req: Request) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const updatedMsgBox = await prismaPostgres.user_msg_box.updateMany({
        where: {
          id: Number(id),
          userId: user.id,
          clientId: user.clientId
        },
        data: {
          readFlag: true,
          modUser: user.id.toString(),
          modDate: new Date()
        }
      });

      if (updatedMsgBox.count === 0) {
        throw createValidationError('Message not found or access denied', [
          { field: 'id', message: 'Invalid message ID or insufficient permissions' }
        ]);
      }

      return {
        data: { updated: updatedMsgBox.count },
        message: 'Message marked as read successfully'
      };
    } catch (error) {
      logger.error('Error marking message as read:', error);
      throw error;
    }
  },

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(req: Request) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const updatedMsgBox = await prismaPostgres.user_msg_box.updateMany({
        where: {
          id: Number(id),
          userId: user.id,
          clientId: user.clientId
        },
        data: {
          deleteFlag: true,
          modUser: user.id.toString(),
          modDate: new Date()
        }
      });

      if (updatedMsgBox.count === 0) {
        throw createValidationError('Message not found or access denied', [
          { field: 'id', message: 'Invalid message ID or insufficient permissions' }
        ]);
      }

      return {
        data: { deleted: updatedMsgBox.count },
        message: 'Message deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }
};