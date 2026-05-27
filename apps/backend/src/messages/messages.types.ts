import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  ObjectType,
} from '@nestjs/graphql';
import { PageInfo } from '../common/graphql/page-info.type';
import { PublicUser } from '../common/graphql/public-user.type';

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

  @Field(() => PublicUser)
  sender!: PublicUser;

  @Field(() => PublicUser)
  receiver!: PublicUser;

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

  @Field(() => PageInfo)
  pageInfo!: PageInfo;
}
