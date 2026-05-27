import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  ObjectType,
} from '@nestjs/graphql';

@ObjectType('MessageParticipant')
export class MessageParticipant {
  @Field(() => ID)
  id!: string;

  @Field()
  username!: string;

  @Field(() => String, { nullable: true })
  avatarUrl!: string | null;
}

@ObjectType('MessagePageInfo')
export class MessagePageInfo {
  @Field(() => String, { nullable: true })
  nextCursor?: string;

  @Field()
  hasNextPage!: boolean;
}

@ObjectType('Message')
export class MessageType {
  @Field(() => ID)
  id!: string;

  @Field()
  content!: string;

  @Field(() => ID)
  senderId!: string;

  @Field(() => ID)
  receiverId!: string;

  @Field(() => MessageParticipant)
  sender!: MessageParticipant;

  @Field(() => MessageParticipant)
  receiver!: MessageParticipant;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}

@InputType()
export class SendMessageInput {
  @Field(() => ID)
  receiverId!: string;

  @Field()
  content!: string;
}

@ObjectType()
export class MessageConnection {
  @Field(() => [MessageType])
  nodes!: MessageType[];

  @Field(() => MessagePageInfo)
  pageInfo!: MessagePageInfo;
}
