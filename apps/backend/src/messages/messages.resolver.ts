import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserModel } from '../users/models/user.model';
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
    @Context() context: { req: { user: UserModel } },
    @Args('withUserId', { type: () => ID }) withUserId: string,
    @Args('cursor', { type: () => ID, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 30 })
    limit?: number,
  ): Promise<MessageConnection> {
    return this.messagesService.findConversation(
      context.req.user.id,
      withUserId,
      cursor,
      limit,
    );
  }

  @Mutation(() => MessageType)
  @UseGuards(GqlAuthGuard)
  sendMessage(
    @Context() context: { req: { user: UserModel } },
    @Args('input') input: SendMessageInput,
  ): Promise<MessageType> {
    return this.messagesService.send(
      context.req.user.id,
      input.receiverId,
      input.content,
    );
  }
}
