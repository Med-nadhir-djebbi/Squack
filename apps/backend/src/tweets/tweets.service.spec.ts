import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DomainEventsService } from '../common/events/domain-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { TweetsService } from './tweets.service';

describe('TweetsService', () => {
  const createdAt = new Date('2026-05-27T18:00:00.000Z');
  const tweet = {
    id: 'tweet-1',
    content: 'Hello Squack',
    authorId: 'user-1',
    author: {
      id: 'user-1',
      username: 'aziz',
      avatarUrl: null,
    },
    createdAt,
    updatedAt: createdAt,
  };

  let service: TweetsService;
  let prisma: {
    tweet: {
      create: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let events: { emit: jest.Mock };

  beforeEach(() => {
    prisma = {
      tweet: {
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    events = { emit: jest.fn() };
    service = new TweetsService(
      prisma as unknown as PrismaService,
      events as unknown as DomainEventsService,
    );
  });

  it('creates a trimmed tweet and emits an event after storage', async () => {
    prisma.tweet.create.mockResolvedValue(tweet);

    await expect(service.create('user-1', '  Hello Squack  ')).resolves.toBe(
      tweet,
    );
    expect(prisma.tweet.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { authorId: 'user-1', content: 'Hello Squack' },
      }),
    );
    expect(events.emit).toHaveBeenCalledWith('tweet.created', tweet);
  });

  it('rejects tweets longer than 280 characters before storage', async () => {
    await expect(service.create('user-1', 'x'.repeat(281))).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.tweet.create).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('does not allow another user to delete a tweet', async () => {
    prisma.tweet.findUnique.mockResolvedValue({ authorId: 'user-2' });

    await expect(service.delete('user-1', 'tweet-1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.tweet.delete).not.toHaveBeenCalled();
  });

  it('returns cursor pagination metadata for a user timeline', async () => {
    prisma.tweet.findMany.mockResolvedValue([
      tweet,
      { ...tweet, id: 'tweet-2' },
    ]);

    await expect(
      service.findUserTweets('user-1', undefined, 1),
    ).resolves.toEqual({
      nodes: [tweet],
      pageInfo: { hasNextPage: true, nextCursor: 'tweet-1' },
    });
  });
});
