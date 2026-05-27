import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DomainEventsService } from '../common/events/domain-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { TweetConnection, TweetType } from './tweets.types';

const tweetWithAuthor = {
  author: {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
    },
  },
} as const;

@Injectable()
export class TweetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: DomainEventsService,
  ) {}

  async findById(id: string): Promise<TweetType | null> {
    return this.prisma.tweet.findUnique({
      where: { id },
      include: tweetWithAuthor,
    });
  }

  async findUserTweets(
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<TweetConnection> {
    const pageSize = this.validatePageSize(limit);
    const tweets = await this.prisma.tweet.findMany({
      where: { authorId: userId },
      include: tweetWithAuthor,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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
    const tweet = await this.prisma.tweet.create({
      data: {
        authorId,
        content: this.validateContent(content),
      },
      include: tweetWithAuthor,
    });

    this.events.emit('tweet.created', tweet);

    return tweet;
  }

  async delete(authorId: string, tweetId: string): Promise<boolean> {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id: tweetId },
      select: { authorId: true },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    if (tweet.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own tweets');
    }

    await this.prisma.tweet.delete({ where: { id: tweetId } });

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
}
