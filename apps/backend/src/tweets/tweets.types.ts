import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  ObjectType,
} from '@nestjs/graphql';
import { PageInfo } from '../common/graphql/page-info.type';
import { PublicUser } from '../common/graphql/public-user.type';

@ObjectType('Tweet')
export class TweetType {
  @Field(() => ID)
  id!: string;

  @Field()
  content!: string;

  @Field(() => ID)
  authorId!: string;

  @Field(() => PublicUser)
  author!: PublicUser;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

@InputType()
export class CreateTweetInput {
  @Field()
  content!: string;
}

@ObjectType()
export class TweetConnection {
  @Field(() => [TweetType])
  nodes!: TweetType[];

  @Field(() => PageInfo)
  pageInfo!: PageInfo;
}
