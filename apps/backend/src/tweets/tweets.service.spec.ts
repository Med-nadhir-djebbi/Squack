import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TweetsEvents } from './tweets.events';
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
  let repository: {
    create: jest.Mock;
    delete: jest.Mock;
    findById: jest.Mock;
    findOwner: jest.Mock;
    findUserTweets: jest.Mock;
  };
  let events: { emitCreated: jest.Mock };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findOwner: jest.fn(),
      findUserTweets: jest.fn(),
    };
    events = { emitCreated: jest.fn() };
    service = new TweetsService(repository, events as unknown as TweetsEvents);
  });

  it('creates a trimmed tweet and emits an event after storage', async () => {
    repository.create.mockResolvedValue(tweet);

    await expect(service.create('user-1', '  Hello Squack  ')).resolves.toBe(
      tweet,
    );
    expect(repository.create).toHaveBeenCalledWith('user-1', 'Hello Squack');
    expect(events.emitCreated).toHaveBeenCalledWith(tweet);
  });

  it('rejects tweets longer than 280 characters before storage', async () => {
    await expect(service.create('user-1', 'x'.repeat(281))).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.create).not.toHaveBeenCalled();
    expect(events.emitCreated).not.toHaveBeenCalled();
  });

  it('does not allow another user to delete a tweet', async () => {
    repository.findOwner.mockResolvedValue({ authorId: 'user-2' });

    await expect(service.delete('user-1', 'tweet-1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('returns cursor pagination metadata for a user timeline', async () => {
    repository.findUserTweets.mockResolvedValue([
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
