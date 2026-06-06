/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesEvents } from './messages.events';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  const message = {
    id: 'message-1',
    content: 'hello',
    senderId: 'sender-1',
    receiverId: 'receiver-1',
    sender: { id: 'sender-1', username: 'alice', avatarUrl: null },
    receiver: { id: 'receiver-1', username: 'bob', avatarUrl: null },
    createdAt: new Date(),
  };
  const notification = {
    id: 'notification-1',
    type: NotificationType.MESSAGE,
    message: '@alice sent you a message',
    isRead: false,
    userId: 'receiver-1',
    actorId: 'sender-1',
    createdAt: new Date(),
  };

  it('publishes events only after the transaction commits', async () => {
    const order: string[] = [];
    const transaction = {
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: message.receiverId }),
      },
      message: {
        create: jest.fn().mockImplementation(() => {
          order.push('message-created');
          return Promise.resolve(message);
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation(async (callback) => {
        const value = await callback(transaction);
        order.push('committed');
        return value;
      }),
    } as unknown as PrismaService;
    const events = {
      emitSent: jest.fn().mockImplementation(() => {
        order.push('message-published');
      }),
    } as unknown as MessagesEvents;
    const notifications = {
      createInTransaction: jest.fn().mockImplementation(() => {
        order.push('notification-created');
        return Promise.resolve(notification);
      }),
      publish: jest.fn().mockImplementation(() => {
        order.push('notification-published');
      }),
    } as unknown as NotificationsService;
    const service = new MessagesService(prisma, events, notifications);

    await expect(
      service.send('sender-1', 'receiver-1', ' hello '),
    ).resolves.toEqual(message);
    expect(order).toEqual([
      'message-created',
      'notification-created',
      'committed',
      'message-published',
      'notification-published',
    ]);
    expect(notifications.createInTransaction).toHaveBeenCalledWith(
      transaction,
      'receiver-1',
      NotificationType.MESSAGE,
      '@alice sent you a message',
      'sender-1',
    );
  });

  it('does not publish when notification persistence fails', async () => {
    const transaction = {
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: message.receiverId }),
      },
      message: { create: jest.fn().mockResolvedValue(message) },
    };
    const prisma = {
      $transaction: jest
        .fn()
        .mockImplementation((callback) => callback(transaction)),
    } as unknown as PrismaService;
    const events = { emitSent: jest.fn() } as unknown as MessagesEvents;
    const notifications = {
      createInTransaction: jest
        .fn()
        .mockRejectedValue(new Error('write failed')),
      publish: jest.fn(),
    } as unknown as NotificationsService;
    const service = new MessagesService(prisma, events, notifications);

    await expect(
      service.send('sender-1', 'receiver-1', 'hello'),
    ).rejects.toThrow('write failed');
    expect(events.emitSent).not.toHaveBeenCalled();
    expect(notifications.publish).not.toHaveBeenCalled();
  });
});
