import { UseGuards } from '@nestjs/common';
import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserModel } from '../users/models/user.model';
import { NotificationsService } from './notifications.service';
import { NotificationModel } from './notifications.types';

@Resolver(() => NotificationModel)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [NotificationModel])
  @UseGuards(GqlAuthGuard)
  notifications(@Context() context: { req: { user: UserModel } }) {
    return this.notificationsService.findAll(context.req.user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  markNotificationAsRead(
    @Context() context: { req: { user: UserModel } },
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.notificationsService.markAsRead(context.req.user.id, id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  markAllNotificationsAsRead(@Context() context: { req: { user: UserModel } }) {
    return this.notificationsService.markAllAsRead(context.req.user.id);
  }
}
