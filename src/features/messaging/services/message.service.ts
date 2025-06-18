// TEMPORARY: Messaging service disabled - tables don't exist in current schema
// TODO: Add user_msg_box, message, msg_group, msg_group_user tables to Prisma schema

import { Request } from 'express';

const MESSAGING_DISABLED = true;

function throwNotImplemented(): never {
  throw new Error('Messaging functionality temporarily disabled - database tables not implemented');
}

export const messageService = {
  async getInboxMessages(req: Request) {
    if (MESSAGING_DISABLED) throwNotImplemented();
    // Original implementation will be restored when tables are added
  },

  async getSentMessages(req: Request) {
    if (MESSAGING_DISABLED) throwNotImplemented();
  },

  async sendMessage(req: Request) {
    if (MESSAGING_DISABLED) throwNotImplemented();
  },

  async markAsRead(req: Request) {
    if (MESSAGING_DISABLED) throwNotImplemented();
  },

  async markAsUnread(req: Request) {
    if (MESSAGING_DISABLED) throwNotImplemented();
  },

  async deleteMessage(req: Request) {
    if (MESSAGING_DISABLED) throwNotImplemented();
  }
};

/* 
 * ORIGINAL IMPLEMENTATION BACKED UP - RESTORE WHEN TABLES ARE ADDED
 * 
 * Tables needed in Prisma schema:
 * - user_msg_box (message box entries for users)
 * - message (actual message content)
 * - msg_group (message groups)
 * - msg_group_user (user membership in message groups)
 * 
 * Original file backed up as message.service.original.ts
 */
