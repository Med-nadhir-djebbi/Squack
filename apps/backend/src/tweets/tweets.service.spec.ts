/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TweetsEvents } from './tweets.events';
import { TweetsService } from './tweets.service';

describe('TweetsService', () => {
  it('commits follower notifications before publishing the tweet', async () => {
    const order: string[] = [];
    const tweet = {
      id: 'tweet-1',
      content: 'hello world',
      authorId: 'author-1',
      author: { id: 'author-1', username: 'alice', avatarUrl: null },
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      reactions: [],
    };
    const notification = {
      id: 'notification-1',
      type: NotificationType.TWEET,
      message: '@alice posted a new tweet: hello world',
      isRead: false,
      userId: 'follower-1',
      actorId: 'author-1',
      createdAt: new Date(),
    };
    const transaction = {
      tweet: { create: jest.fn().mockResolvedValue(tweet) },
      follow: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ followerId: notification.userId }]),
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
      emitCreated: jest.fn().mockImplementation(() => {
        order.push('tweet-published');
      }),
    } as unknown as TweetsEvents;
    const notifications = {
      createInTransaction: jest.fn().mockResolvedValue(notification),
      publish: jest.fn().mockImplementation(() => {
        order.push('notification-published');
      }),
    } as unknown as NotificationsService;
    const service = new TweetsService(prisma, events, notifications);

    await expect(
      service.create('author-1', { content: ' hello world ' }),
    ).resolves.toMatchObject({
      id: 'tweet-1',
      content: 'hello world',
    });
    expect(order).toEqual([
      'committed',
      'tweet-published',
      'notification-published',
    ]);
    expect(notifications.createInTransaction).toHaveBeenCalledWith(
      transaction,
      'follower-1',
      NotificationType.TWEET,
      '@alice posted a new tweet: hello world',
      'author-1',
    );
  });
});
