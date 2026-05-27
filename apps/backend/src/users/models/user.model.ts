import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserModel {
  @Field()
  id: string;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  bio?: string | null;

  @Field({ nullable: true })
  avatarUrl?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
