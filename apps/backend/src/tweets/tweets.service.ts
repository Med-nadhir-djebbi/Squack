import {BadRequestException,ForbiddenException,Injectable,NotFoundException,} from '@nestjs/common';
import { NotificationType, TweetReactionKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TweetsEvents } from './tweets.events';
import { TweetConnection, TweetType } from './tweets.types';
import { NotificationsService } from '../notifications/notifications.service';

const tweetDetails = {
  author: {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
    },
  },
  reactions: {
    select: {
      kind: true,
    },
  },
} as const;

interface StoredTweet {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
  reactions: Array<{ kind: TweetReactionKind }>;
}

@Injectable()
export class TweetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: TweetsEvents,
    private readonly notifications: NotificationsService,
  ) {}

  async findById(id: string): Promise<TweetType | null> {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id },
      include: tweetDetails,
    });

    return tweet ? this.toTweet(tweet) : null;
  }

  async findAll(cursor?: string, limit = 20): Promise<TweetConnection> {
    const pageSize = this.validatePageSize(limit);
    const tweets = await this.prisma.tweet.findMany({
      include: tweetDetails,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasNextPage = tweets.length > pageSize;
    const nodes = tweets.slice(0, pageSize).map((tweet) => this.toTweet(tweet));

    return {
      nodes,
      pageInfo: {
        hasNextPage,
        nextCursor: hasNextPage ? nodes[nodes.length - 1]?.id : undefined,
      },
    };
  }

  async findUserTweets(
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<TweetConnection> {
    const pageSize = this.validatePageSize(limit);
    const tweets = await this.prisma.tweet.findMany({
      where: { authorId: userId },
      include: tweetDetails,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasNextPage = tweets.length > pageSize;
    const nodes = tweets.slice(0, pageSize).map((tweet) => this.toTweet(tweet));

    return {
      nodes,
      pageInfo: {
        hasNextPage,
        nextCursor: hasNextPage ? nodes[nodes.length - 1]?.id : undefined,
      },
    };
  }

  async getFeed(
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<TweetConnection> {
    const pageSize = this.validatePageSize(limit);

    // Get IDs of users being followed
    const followed = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = followed.map((f) => f.followingId);

    // Include the user's own tweets in their feed
    const authorIds = [...followingIds, userId];

    const tweets = await this.prisma.tweet.findMany({
      where: {
        authorId: { in: authorIds },
      },
      include: tweetDetails,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasNextPage = tweets.length > pageSize;
    const nodes = tweets.slice(0, pageSize).map((tweet) => this.toTweet(tweet));

    return {
      nodes,
      pageInfo: {
        hasNextPage,
        nextCursor: hasNextPage ? nodes[nodes.length - 1]?.id : undefined,
      },
    };
  }

  async create(authorId: string, content: string): Promise<TweetType> {
    const storedTweet = await this.prisma.tweet.create({
      data: {
        authorId,
        content: this.validateContent(content),
      },
      include: tweetDetails,
    });
    const tweet = this.toTweet(storedTweet);

    this.events.emitCreated(tweet);

    // Notify followers
    const followers = await this.prisma.follow.findMany({
      where: { followingId: authorId },
      select: { followerId: true },
    });

    for (const f of followers) {
      await this.notifications.createNotification(
        f.followerId,
        NotificationType.TWEET,
        `@${tweet.author.username} posted a new tweet: ${tweet.content.substring(0, 30)}${tweet.content.length > 30 ? '...' : ''}`,
      );
    }

    return tweet;
  }

  async delete(authorId: string, tweetId: string): Promise<boolean> {
    await this.assertOwner(authorId, tweetId, 'delete');

    await this.prisma.tweet.delete({ where: { id: tweetId } });

    return true;
  }

  async update(
    authorId: string,
    tweetId: string,
    content: string,
  ): Promise<TweetType> {
    await this.assertOwner(authorId, tweetId, 'edit');

    const storedTweet = await this.prisma.tweet.update({
      where: { id: tweetId },
      data: {
        content: this.validateContent(content),
      },
      include: tweetDetails,
    });

    return this.toTweet(storedTweet);
  }

  async react(
    userId: string,
    tweetId: string,
    kind: TweetReactionKind,
  ): Promise<TweetType> {
    await this.assertExists(tweetId);

    await this.prisma.tweetReaction.upsert({
      where: {
        tweetId_userId: { tweetId, userId },
      },
      create: { tweetId, userId, kind },
      update: { kind },
    });

    return this.findRequiredTweet(tweetId);
  }

  async removeReaction(userId: string, tweetId: string): Promise<TweetType> {
    await this.assertExists(tweetId);

    await this.prisma.tweetReaction.deleteMany({
      where: { tweetId, userId },
    });

    return this.findRequiredTweet(tweetId);
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

  private async assertExists(tweetId: string): Promise<void> {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id: tweetId },
      select: { id: true },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }
  }

  private async assertOwner(
    authorId: string,
    tweetId: string,
    action: 'delete' | 'edit',
  ): Promise<void> {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id: tweetId },
      select: { authorId: true },
    });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    if (tweet.authorId !== authorId) {
      throw new ForbiddenException(`You can only ${action} your own tweets`);
    }
  }

  private async findRequiredTweet(tweetId: string): Promise<TweetType> {
    const tweet = await this.findById(tweetId);

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    return tweet;
  }

  private toTweet(tweet: StoredTweet): TweetType {
    const reactionCounts = Object.values(TweetReactionKind)
      .map((kind) => ({
        kind,
        count: tweet.reactions.filter((reaction) => reaction.kind === kind)
          .length,
      }))
      .filter((reaction) => reaction.count > 0);

    return {
      id: tweet.id,
      content: tweet.content,
      authorId: tweet.authorId,
      author: tweet.author,
      createdAt: tweet.createdAt,
      updatedAt: tweet.updatedAt,
      reactionCount: tweet.reactions.length,
      reactionCounts,
    };
  }
}
