import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DomainEventsService } from '../common/events/domain-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  const createdAt = new Date('2026-05-27T18:00:00.000Z');
  const message = {
    id: 'message-1',
    content: 'Hello',
    senderId: 'user-1',
    receiverId: 'user-2',
    sender: { id: 'user-1', username: 'aziz', avatarUrl: null },
    receiver: { id: 'user-2', username: 'mouna', avatarUrl: null },
    createdAt,
  };

  let service: MessagesService;
  let prisma: {
    message: { create: jest.Mock; findMany: jest.Mock };
    user: { findFirst: jest.Mock };
  };
  let events: { emit: jest.Mock };

  beforeEach(() => {
    prisma = {
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      user: { findFirst: jest.fn() },
    };
    events = { emit: jest.fn() };
    service = new MessagesService(
      prisma as unknown as PrismaService,
      events as unknown as DomainEventsService,
    );
  });

  it('stores a direct message and emits it for realtime delivery', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-2' });
    prisma.message.create.mockResolvedValue(message);

    await expect(service.send('user-1', 'user-2', '  Hello  ')).resolves.toBe(
      message,
    );
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          senderId: 'user-1',
          receiverId: 'user-2',
          content: 'Hello',
        },
      }),
    );
    expect(events.emit).toHaveBeenCalledWith('message.sent', message);
  });

  it('rejects a message addressed to the sender', async () => {
    await expect(service.send('user-1', 'user-1', 'Hello')).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('rejects a message addressed to a missing user', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.send('user-1', 'missing', 'Hello')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('returns both sides of a cursor-paginated conversation', async () => {
    prisma.message.findMany.mockResolvedValue([
      message,
      { ...message, id: 'message-2' },
    ]);

    await expect(
      service.findConversation('user-1', 'user-2', undefined, 1),
    ).resolves.toEqual({
      nodes: [message],
      pageInfo: { hasNextPage: true, nextCursor: 'message-1' },
    });
    expect(prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { senderId: 'user-1', receiverId: 'user-2' },
            { senderId: 'user-2', receiverId: 'user-1' },
          ],
        },
      }),
    );
  });
});
