import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserModel {
  @Field()
  id: string;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
