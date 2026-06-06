import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { UserModel } from '../users/models/user.model';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => UserModel)
export class FollowsResolver {
  constructor(private readonly followsService: FollowsService) {}

  @Query(() => [UserModel])
  @UseGuards(GqlAuthGuard)
  followers(@Args('userId', { type: () => ID }) userId: string) {
    return this.followsService.getFollowers(userId);
  }

  @Query(() => [UserModel])
  @UseGuards(GqlAuthGuard)
  following(@Args('userId', { type: () => ID }) userId: string) {
    return this.followsService.getFollowing(userId);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  follow(
    @Context() context: { req: { user: UserModel } },
    @Args('userId', { type: () => ID }) userId: string,
  ) {
    return this.followsService.follow(context.req.user.id, userId);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  unfollow(
    @Context() context: { req: { user: UserModel } },
    @Args('userId', { type: () => ID }) userId: string,
  ) {
    return this.followsService.unfollow(context.req.user.id, userId);
  }
}
