import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PageInfo {
  @Field(() => String, { nullable: true })
  nextCursor?: string;

  @Field()
  hasNextPage!: boolean;
}
