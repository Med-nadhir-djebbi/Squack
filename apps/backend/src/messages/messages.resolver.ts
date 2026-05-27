import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import {
  MessageConnection,
  MessageType,
  SendMessageInput,
} from './messages.types';
import { MessagesService } from './messages.service';

@Resolver(() => MessageType)
export class MessagesResolver {
  constructor(private readonly messagesService: MessagesService) {}

  @Query(() => MessageConnection)
  @UseGuards(GqlAuthGuard)
  conversation(
    @CurrentUser() user: AuthenticatedUser,
    @Args('withUserId', { type: () => ID }) withUserId: string,
    @Args('cursor', { type: () => ID, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 30 })
    limit?: number,
  ): Promise<MessageConnection> {
    return this.messagesService.findConversation(
      user.id,
      withUserId,
      cursor,
      limit,
    );
  }

  @Mutation(() => MessageType)
  @UseGuards(GqlAuthGuard)
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: SendMessageInput,
  ): Promise<MessageType> {
    return this.messagesService.send(user.id, input.receiverId, input.content);
  }
}
