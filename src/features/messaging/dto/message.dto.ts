// src/features/messaging/dto/message.dto.ts
export interface CreateMessageDto {
  subject?: string;
  content: string;
  clientId: number;
  recipientIds: number[];
  validFrom: Date;
  validTo?: Date;
  perView?: boolean;
  perWrite?: boolean;
  perReply?: boolean;
}

export interface MessageResponseDto {
  id: number;
  subject?: string;
  content: string;
  validFrom: Date;
  validTo?: Date;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
  };
  client: {
    id: number;
    name: string;
  };
  crDate: Date;
}

export interface MsgGroupDto {
  id: number;
  name: string;
  clientId: number;
  members: {
    userId: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
    };
    permissions: {
      perView: boolean;
      perWrite: boolean;
      perReply: boolean;
    };
  }[];
}