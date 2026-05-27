import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesEvents } from './messages.events';
import { MessageConnection, MessageType } from './messages.types';

const messageWithUsers = {
  sender: {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
    },
  },
  receiver: {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
    },
  },
} as const;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
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
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: withUserId },
          { senderId: withUserId, receiverId: userId },
        ],
      },
      include: messageWithUsers,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

    const receiver = await this.prisma.user.findFirst({
      where: { id: receiverId, isDeleted: false },
      select: { id: true },
    });

    if (!receiver) {
      throw new NotFoundException('Message receiver not found');
    }

    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: this.validateContent(content),
      },
      include: messageWithUsers,
    });

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
}
