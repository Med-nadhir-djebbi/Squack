import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TweetReactionKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TweetsEvents } from './tweets.events';
import { TweetsService } from './tweets.service';

describe('TweetsService', () => {
  const createdAt = new Date('2026-05-27T18:00:00.000Z');
  const storedTweet = {
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
    reactions: [],
  };
  const tweet = {
    id: storedTweet.id,
    content: storedTweet.content,
    authorId: storedTweet.authorId,
    author: storedTweet.author,
    createdAt,
    updatedAt: createdAt,
    reactionCount: 0,
    reactionCounts: [],
  };

  let service: TweetsService;
  let prisma: {
    tweet: {
      create: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    tweetReaction: {
      deleteMany: jest.Mock;
      upsert: jest.Mock;
    };
  };
  let events: { emitCreated: jest.Mock };

  beforeEach(() => {
    prisma = {
      tweet: {
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      tweetReaction: {
        deleteMany: jest.fn(),
        upsert: jest.fn(),
      },
    };
    events = { emitCreated: jest.fn() };
    service = new TweetsService(
      prisma as unknown as PrismaService,
      events as unknown as TweetsEvents,
    );
  });

  it('creates a trimmed tweet and emits an event after storage', async () => {
    prisma.tweet.create.mockResolvedValue(storedTweet);

    await expect(service.create('user-1', '  Hello Squack  ')).resolves.toEqual(
      tweet,
    );
    expect(prisma.tweet.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { authorId: 'user-1', content: 'Hello Squack' },
      }),
    );
    expect(events.emitCreated).toHaveBeenCalledWith(tweet);
  });

  it('rejects tweets longer than 280 characters before storage', async () => {
    await expect(service.create('user-1', 'x'.repeat(281))).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.tweet.create).not.toHaveBeenCalled();
    expect(events.emitCreated).not.toHaveBeenCalled();
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
      storedTweet,
      { ...storedTweet, id: 'tweet-2' },
    ]);

    await expect(
      service.findUserTweets('user-1', undefined, 1),
    ).resolves.toEqual({
      nodes: [tweet],
      pageInfo: { hasNextPage: true, nextCursor: 'tweet-1' },
    });
  });

  it('creates or changes one reaction for a user and returns updated totals', async () => {
    const reactedTweet = {
      ...storedTweet,
      reactions: [{ kind: TweetReactionKind.LIKE }],
    };

    prisma.tweet.findUnique
      .mockResolvedValueOnce({ id: 'tweet-1' })
      .mockResolvedValueOnce(reactedTweet);
    prisma.tweetReaction.upsert.mockResolvedValue({
      id: 'reaction-1',
      tweetId: 'tweet-1',
      userId: 'user-2',
      kind: TweetReactionKind.LIKE,
    });

    await expect(
      service.react('user-2', 'tweet-1', TweetReactionKind.LIKE),
    ).resolves.toEqual({
      ...tweet,
      reactionCount: 1,
      reactionCounts: [{ kind: TweetReactionKind.LIKE, count: 1 }],
    });
    expect(prisma.tweetReaction.upsert).toHaveBeenCalledWith({
      where: {
        tweetId_userId: { tweetId: 'tweet-1', userId: 'user-2' },
      },
      create: {
        tweetId: 'tweet-1',
        userId: 'user-2',
        kind: TweetReactionKind.LIKE,
      },
      update: { kind: TweetReactionKind.LIKE },
    });
  });

  it('removes the signed-in user reaction and returns refreshed totals', async () => {
    prisma.tweet.findUnique
      .mockResolvedValueOnce({ id: 'tweet-1' })
      .mockResolvedValueOnce(storedTweet);

    await expect(service.removeReaction('user-2', 'tweet-1')).resolves.toEqual(
      tweet,
    );
    expect(prisma.tweetReaction.deleteMany).toHaveBeenCalledWith({
      where: { tweetId: 'tweet-1', userId: 'user-2' },
    });
  });
});
