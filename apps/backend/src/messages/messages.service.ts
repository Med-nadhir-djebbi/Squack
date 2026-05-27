import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MessagesEvents } from './messages.events';
import { MessagesRepository } from './messages.repository';
import { MessageConnection, MessageType } from './messages.types';

@Injectable()
export class MessagesService {
  constructor(
    @Inject(MessagesRepository)
    @Optional()
    private readonly repository: MessagesRepository | undefined,
    private readonly events: MessagesEvents,
  ) {}

  async findConversation(
    userId: string,
    withUserId: string,
    cursor?: string,
    limit = 30,
  ): Promise<MessageConnection> {
    if (userId === withUserId) {
      throw new BadRequestException('A conversation requires another user');
    }

    const pageSize = this.validatePageSize(limit);
    const messages = await this.data.findConversation({
      userId,
      withUserId,
      take: pageSize + 1,
      cursor,
    });

    const hasNextPage = messages.length > pageSize;
    const nodes = messages.slice(0, pageSize);

    return {
      nodes,
      pageInfo: {
        hasNextPage,
        nextCursor: hasNextPage ? nodes[nodes.length - 1]?.id : undefined,
      },
    };
  }

  async send(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<MessageType> {
    if (senderId === receiverId) {
      throw new BadRequestException('You cannot message yourself');
    }

    const receiverExists = await this.data.receiverExists(receiverId);

    if (!receiverExists) {
      throw new NotFoundException('Message receiver not found');
    }

    const message = await this.data.create(
      senderId,
      receiverId,
      this.validateContent(content),
    );

    this.events.emitSent(message);

    return message;
  }

  private validateContent(content: string): string {
    const value = content.trim();

    if (!value) {
      throw new BadRequestException('Message content is required');
    }

    if (value.length > 2000) {
      throw new BadRequestException(
        'Message content must be 2000 characters or fewer',
      );
    }

    return value;
  }

  private validatePageSize(limit: number): number {
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new BadRequestException('Limit must be between 1 and 50');
    }

    return limit;
  }

  private get data(): MessagesRepository {
    if (!this.repository) {
      throw new ServiceUnavailableException(
        'Messages repository has not been connected',
      );
    }

    return this.repository;
  }
}
