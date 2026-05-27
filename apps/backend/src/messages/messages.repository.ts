import { MessageType } from './messages.types';

export interface ConversationPage {
  userId: string;
  withUserId: string;
  cursor?: string;
  take: number;
}

export abstract class MessagesRepository {
  abstract findConversation(input: ConversationPage): Promise<MessageType[]>;
  abstract receiverExists(receiverId: string): Promise<boolean>;
  abstract create(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<MessageType>;
}
