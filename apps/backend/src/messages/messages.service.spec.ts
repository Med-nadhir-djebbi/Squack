import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MessagesEvents } from './messages.events';
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
  let repository: {
    create: jest.Mock;
    findConversation: jest.Mock;
    receiverExists: jest.Mock;
  };
  let events: { emitSent: jest.Mock };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findConversation: jest.fn(),
      receiverExists: jest.fn(),
    };
    events = { emitSent: jest.fn() };
    service = new MessagesService(
      repository,
      events as unknown as MessagesEvents,
    );
  });

  it('stores a direct message and emits it for realtime delivery', async () => {
    repository.receiverExists.mockResolvedValue(true);
    repository.create.mockResolvedValue(message);

    await expect(service.send('user-1', 'user-2', '  Hello  ')).resolves.toBe(
      message,
    );
    expect(repository.create).toHaveBeenCalledWith('user-1', 'user-2', 'Hello');
    expect(events.emitSent).toHaveBeenCalledWith(message);
  });

  it('rejects a message addressed to the sender', async () => {
    await expect(service.send('user-1', 'user-1', 'Hello')).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects a message addressed to a missing user', async () => {
    repository.receiverExists.mockResolvedValue(false);

    await expect(service.send('user-1', 'missing', 'Hello')).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('returns both sides of a cursor-paginated conversation', async () => {
    repository.findConversation.mockResolvedValue([
      message,
      { ...message, id: 'message-2' },
    ]);

    await expect(
      service.findConversation('user-1', 'user-2', undefined, 1),
    ).resolves.toEqual({
      nodes: [message],
      pageInfo: { hasNextPage: true, nextCursor: 'message-1' },
    });
    expect(repository.findConversation).toHaveBeenCalledWith({
      userId: 'user-1',
      withUserId: 'user-2',
      cursor: undefined,
      take: 2,
    });
  });
});
