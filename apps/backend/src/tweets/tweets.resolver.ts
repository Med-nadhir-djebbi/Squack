import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { TweetsService } from './tweets.service';
import { CreateTweetInput, TweetConnection, TweetType } from './tweets.types';

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
  @UseGuards(GqlAuthGuard)
  createTweet(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreateTweetInput,
  ): Promise<TweetType> {
    return this.tweetsService.create(user.id, input.content);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  deleteTweet(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.tweetsService.delete(user.id, id);
  }
}
