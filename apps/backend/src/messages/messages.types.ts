import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  ObjectType,
} from '@nestjs/graphql';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

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
  @IsUUID()
  receiverId!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

@ObjectType()
export class MessageConnection {
  @Field(() => [MessageType])
  nodes!: MessageType[];

  @Field(() => MessagePageInfo)
  pageInfo!: MessagePageInfo;
}
