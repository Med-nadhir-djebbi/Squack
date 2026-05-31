import { UseGuards } from '@nestjs/common';
import {Args,Context,ID,Int,Mutation,Query,Resolver,
} from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserModel } from '../users/models/user.model';
import { TweetsService } from './tweets.service';
import {
  CreateTweetInput,
  ReactToTweetInput,
  TweetConnection,
  TweetType,
  UpdateTweetInput,
} from './tweets.types';

@Resolver(() => TweetType)
export class TweetsResolver {
  constructor(private readonly tweetsService: TweetsService) {}

  @Query(() => TweetType, { nullable: true })
  tweet(@Args('id', { type: () => ID }) id: string): Promise<TweetType | null> {
    return this.tweetsService.findById(id);
  }

  @Query(() => TweetConnection)
  @UseGuards(GqlAuthGuard)
  tweets(
    @Args('cursor', { type: () => ID, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit?: number,
  ): Promise<TweetConnection> {
    return this.tweetsService.findAll(cursor, limit);
  }

  @Query(() => TweetConnection)
  @UseGuards(GqlAuthGuard)
  feed(
    @Context() context: { req: { user: UserModel } },
    @Args('cursor', { type: () => ID, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit?: number,
  ): Promise<TweetConnection> {
    return this.tweetsService.getFeed(context.req.user.id, cursor, limit);
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
    @Context() context: { req: { user: UserModel } },
    @Args('input') input: CreateTweetInput,
  ): Promise<TweetType> {
    return this.tweetsService.create(context.req.user.id, input.content);
  }

  @Mutation(() => TweetType)
  @UseGuards(GqlAuthGuard)
  updateTweet(
    @Context() context: { req: { user: UserModel } },
    @Args('input') input: UpdateTweetInput,
  ): Promise<TweetType> {
    return this.tweetsService.update(
      context.req.user.id,
      input.id,
      input.content,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  deleteTweet(
    @Context() context: { req: { user: UserModel } },
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.tweetsService.delete(context.req.user.id, id);
  }

  @Mutation(() => TweetType)
  @UseGuards(GqlAuthGuard)
  reactToTweet(
    @Context() context: { req: { user: UserModel } },
    @Args('input') input: ReactToTweetInput,
  ): Promise<TweetType> {
    return this.tweetsService.react(
      context.req.user.id,
      input.tweetId,
      input.kind,
    );
  }

  @Mutation(() => TweetType)
  @UseGuards(GqlAuthGuard)
  removeTweetReaction(
    @Context() context: { req: { user: UserModel } },
    @Args('tweetId', { type: () => ID }) tweetId: string,
  ): Promise<TweetType> {
    return this.tweetsService.removeReaction(context.req.user.id, tweetId);
  }
}
