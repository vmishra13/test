// TEMPORARY: Message group service disabled - tables don't exist in current schema  
// TODO: Add msg_group, msg_group_user tables to Prisma schema

import { Request } from 'express';

const MSG_GROUP_DISABLED = true;

function throwNotImplemented(): never {
  throw new Error('Message group functionality temporarily disabled - database tables not implemented');
}

export const msgGroupService = {
  async getUserGroups(req: Request) {
    if (MSG_GROUP_DISABLED) throwNotImplemented();
  },

  async createGroup(req: Request) {
    if (MSG_GROUP_DISABLED) throwNotImplemented();
  },

  async getGroupDetails(req: Request) {
    if (MSG_GROUP_DISABLED) throwNotImplemented();
  },

  async addUserToGroup(req: Request) {
    if (MSG_GROUP_DISABLED) throwNotImplemented();
  },

  async removeUserFromGroup(req: Request) {
    if (MSG_GROUP_DISABLED) throwNotImplemented();
  }
};

/* 
 * ORIGINAL IMPLEMENTATION BACKED UP - RESTORE WHEN TABLES ARE ADDED
 * 
 * Tables needed in Prisma schema:
 * - msg_group (message groups)
 * - msg_group_user (user membership in message groups)
 * 
 * Original file backed up as msg-group.service.original.ts
 */
