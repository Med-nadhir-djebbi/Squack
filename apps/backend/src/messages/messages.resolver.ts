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
import {
  MessageConnection,
  MessageType,
  SendMessageInput,
} from './messages.types';
import { MessagesService } from './messages.service';

interface MessagesRequestContext {
  req: {
    user?: {
      id?: string;
    };
  };
}

@Resolver(() => MessageType)
export class MessagesResolver {
  constructor(private readonly messagesService: MessagesService) {}

  @Query(() => MessageConnection)
  conversation(
    @Context() context: MessagesRequestContext,
    @Args('withUserId', { type: () => ID }) withUserId: string,
    @Args('cursor', { type: () => ID, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 30 })
    limit?: number,
  ): Promise<MessageConnection> {
    return this.messagesService.findConversation(
      this.requireUserId(context),
      withUserId,
      cursor,
      limit,
    );
  }

  @Mutation(() => MessageType)
  sendMessage(
    @Context() context: MessagesRequestContext,
    @Args('input') input: SendMessageInput,
  ): Promise<MessageType> {
    return this.messagesService.send(
      this.requireUserId(context),
      input.receiverId,
      input.content,
    );
  }

  private requireUserId(context: MessagesRequestContext): string {
    const userId = context.req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Authentication is required');
    }

    return userId;
  }
}
