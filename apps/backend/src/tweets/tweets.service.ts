import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { TweetsEvents } from './tweets.events';
import { TweetsRepository } from './tweets.repository';
import { TweetConnection, TweetType } from './tweets.types';

@Injectable()
export class TweetsService {
  constructor(
    @Inject(TweetsRepository)
    @Optional()
    private readonly repository: TweetsRepository | undefined,
    private readonly events: TweetsEvents,
  ) {}

  async findById(id: string): Promise<TweetType | null> {
    return this.data.findById(id);
  }

  async findUserTweets(
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<TweetConnection> {
    const pageSize = this.validatePageSize(limit);
    const tweets = await this.data.findUserTweets({
      authorId: userId,
      take: pageSize + 1,
      cursor,
    });

    const hasNextPage = tweets.length > pageSize;
    const nodes = tweets.slice(0, pageSize);

    return {
      nodes,
      pageInfo: {
        hasNextPage,
        nextCursor: hasNextPage ? nodes[nodes.length - 1]?.id : undefined,
      },
    };
  }

  async create(authorId: string, content: string): Promise<TweetType> {
    const tweet = await this.data.create(
      authorId,
      this.validateContent(content),
    );

    this.events.emitCreated(tweet);

    return tweet;
  }

  async delete(authorId: string, tweetId: string): Promise<boolean> {
    const tweet = await this.data.findOwner(tweetId);

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    if (tweet.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own tweets');
    }

    await this.data.delete(tweetId);

    return true;
  }

  private validateContent(content: string): string {
    const value = content.trim();

    if (!value) {
      throw new BadRequestException('Tweet content is required');
    }

    if (value.length > 280) {
      throw new BadRequestException(
        'Tweet content must be 280 characters or fewer',
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

  private get data(): TweetsRepository {
    if (!this.repository) {
      throw new ServiceUnavailableException(
        'Tweets repository has not been connected',
      );
    }

    return this.repository;
  }
}
