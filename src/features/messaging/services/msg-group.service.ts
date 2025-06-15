import { Request } from 'express';
import { prismaPostgres } from '@/db/postgres/client';
import { createValidationError, createAuthorizationError } from '@/shared/errors/application-error';
import logger from '@/config/logger';

export const msgGroupService = {
  /**
   * Get message groups for a client
   */
  async getMessageGroups(req: Request) {
    try {
      const { clientId } = req.query;
      const user = (req as any).user; // From auth middleware

      if (!clientId) {
        throw createValidationError('Client ID is required', [
          { field: 'clientId', message: 'Client ID must be provided' }
        ]);
      }

      // Check if user has access to this client
      if (user.clientId !== Number(clientId)) {
        throw createAuthorizationError('Access denied to this client');
      }

      const msgGroups = await prismaPostgres.msg_group.findMany({
        where: {
          clientId: Number(clientId)
        },
        include: {
          client: {
            select: { id: true, name: true }
          },
          msgGroupUser: {
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
        }
      });

      return {
        data: msgGroups,
        message: 'Message groups retrieved successfully'
      };
    } catch (error) {
      logger.error('Error getting message groups:', error);
      throw error;
    }
  },

  /**
   * Create a new message group
   */
  async createMessageGroup(req: Request) {
    try {
      const { name, clientId, userIds } = req.body;
      const user = (req as any).user;

      if (!name || !clientId) {
        throw createValidationError('Missing required fields', [
          { field: 'name', message: 'Group name is required' },
          { field: 'clientId', message: 'Client ID is required' }
        ]);
      }

      // Check if user has access to this client
      if (user.clientId !== clientId) {
        throw createAuthorizationError('Access denied to this client');
      }

      const msgGroup = await prismaPostgres.$transaction(async (tx) => {
        // Create the message group
        const newGroup = await tx.msg_group.create({
          data: {
            name,
            clientId,
            crUser: user.id?.toString() || 'system',
            modUser: user.id?.toString() || 'system'
          }
        });

        // Add users to the group if provided
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
          await tx.msg_group_user.createMany({
            data: userIds.map((userId: number) => ({
              userId,
              clientId,
              msgGroupId: newGroup.id,
              validFrom: new Date(),
              perView: true,
              perWrite: true,
              perReply: true,
              crUser: user.id?.toString() || 'system',
              modUser: user.id?.toString() || 'system'
            }))
          });
        }

        return newGroup;
      });

      return {
        data: msgGroup,
        message: 'Message group created successfully'
      };
    } catch (error) {
      logger.error('Error creating message group:', error);
      throw error;
    }
  },

  /**
   * Get a specific message group
   */
  async getMessageGroup(req: Request) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const msgGroup = await prismaPostgres.msg_group.findUnique({
        where: { id: Number(id) },
        include: {
          client: {
            select: { id: true, name: true }
          },
          msgGroupUser: {
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
        }
      });

      if (!msgGroup) {
        throw createValidationError('Message group not found', [
          { field: 'id', message: 'Invalid message group ID' }
        ]);
      }

      // Check if user has access to this client
      if (user.clientId !== msgGroup.clientId) {
        throw createAuthorizationError('Access denied to this message group');
      }

      return {
        data: msgGroup,
        message: 'Message group retrieved successfully'
      };
    } catch (error) {
      logger.error('Error getting message group:', error);
      throw error;
    }
  }
};