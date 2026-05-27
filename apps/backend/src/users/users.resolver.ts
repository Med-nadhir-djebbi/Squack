import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserModel } from './models/user.model';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserModel)
  @UseGuards(GqlAuthGuard)
  user(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @Mutation(() => UserModel)
  @UseGuards(GqlAuthGuard)
  updateProfile(
    @Context() context: { req: { user: UserModel } },
    @Args('bio', { nullable: true }) bio?: string,
    @Args('avatarUrl', { nullable: true }) avatarUrl?: string,
  ) {
    return this.usersService.updateProfile(context.req.user.id, {
      bio,
      avatarUrl,
    });
  }
}
