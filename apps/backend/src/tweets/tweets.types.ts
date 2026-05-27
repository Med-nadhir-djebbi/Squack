import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  ObjectType,
} from '@nestjs/graphql';

@ObjectType('TweetAuthor')
export class TweetAuthor {
  @Field(() => ID)
  id!: string;

  @Field()
  username!: string;

  @Field(() => String, { nullable: true })
  avatarUrl!: string | null;
}

@ObjectType('TweetPageInfo')
export class TweetPageInfo {
  @Field(() => String, { nullable: true })
  nextCursor?: string;

  @Field()
  hasNextPage!: boolean;
}

@ObjectType('Tweet')
export class TweetType {
  @Field(() => ID)
  id!: string;

  @Field()
  content!: string;

  @Field(() => ID)
  authorId!: string;

  @Field(() => TweetAuthor)
  author!: TweetAuthor;

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

  @Field(() => TweetPageInfo)
  pageInfo!: TweetPageInfo;
}
