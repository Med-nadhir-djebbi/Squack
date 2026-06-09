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
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

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
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @Field(() => [TweetType], { nullable: 'itemsAndList' })
  children?: TweetType[];

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
  @IsString()
  @MinLength(1)
  @MaxLength(280)
  content!: string;
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

@InputType()
export class UpdateTweetInput {
  @Field(() => ID)
  id!: string;

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
  @IsUUID()
  tweetId!: string;

  @Field(() => TweetReactionKind)
  @IsEnum(TweetReactionKind)
  kind!: TweetReactionKind;
}

@ObjectType()
export class TweetConnection {
  @Field(() => [TweetType])
  nodes!: TweetType[];

  @Field(() => TweetPageInfo)
  pageInfo!: TweetPageInfo;
}
