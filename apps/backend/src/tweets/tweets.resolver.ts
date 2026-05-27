import { UnauthorizedException } from '@nestjs/common';
import {
  Args,
  Context,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { TweetsService } from './tweets.service';
import { CreateTweetInput, TweetConnection, TweetType } from './tweets.types';

interface TweetsRequestContext {
  req: {
    user?: {
      id?: string;
    };
  };
}

@Resolver(() => TweetType)
export class TweetsResolver {
  constructor(private readonly tweetsService: TweetsService) {}

  @Query(() => TweetType, { nullable: true })
  tweet(@Args('id', { type: () => ID }) id: string): Promise<TweetType | null> {
    return this.tweetsService.findById(id);
  }

  @Query(() => TweetConnection)
  userTweets(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('cursor', { type: () => ID, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit?: number,
  ): Promise<TweetConnection> {
    return this.tweetsService.findUserTweets(userId, cursor, limit);
  }

  @Mutation(() => TweetType)
  createTweet(
    @Context() context: TweetsRequestContext,
    @Args('input') input: CreateTweetInput,
  ): Promise<TweetType> {
    return this.tweetsService.create(
      this.requireUserId(context),
      input.content,
    );
  }

  @Mutation(() => Boolean)
  deleteTweet(
    @Context() context: TweetsRequestContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.tweetsService.delete(this.requireUserId(context), id);
  }

  private requireUserId(context: TweetsRequestContext): string {
    const userId = context.req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Authentication is required');
    }

    return userId;
  }
}
