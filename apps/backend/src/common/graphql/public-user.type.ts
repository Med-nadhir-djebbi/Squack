import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PublicUser {
  @Field(() => ID)
  id!: string;

  @Field()
  username!: string;

  @Field(() => String, { nullable: true })
  avatarUrl!: string | null;
}
