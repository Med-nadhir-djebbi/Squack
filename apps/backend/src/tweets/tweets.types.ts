import { TweetReactionKind } from '@prisma/client';
import {
  Field,
  GraphQLISODateTime,
  ID,
  Int,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

registerEnumType(TweetReactionKind, {
  name: 'TweetReactionKind',
});

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

  @Field(() => Int)
  reactionCount!: number;

  @Field(() => [TweetReactionCount])
  reactionCounts!: TweetReactionCount[];
}

@InputType()
export class CreateTweetInput {
  @Field()
  content!: string;
}

@ObjectType('TweetReactionCount')
export class TweetReactionCount {
  @Field(() => TweetReactionKind)
  kind!: TweetReactionKind;

  @Field(() => Int)
  count!: number;
}

@InputType()
export class ReactToTweetInput {
  @Field(() => ID)
  tweetId!: string;

  @Field(() => TweetReactionKind)
  kind!: TweetReactionKind;
}

@ObjectType()
export class TweetConnection {
  @Field(() => [TweetType])
  nodes!: TweetType[];

  @Field(() => TweetPageInfo)
  pageInfo!: TweetPageInfo;
}
