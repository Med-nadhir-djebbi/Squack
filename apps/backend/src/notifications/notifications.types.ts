import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { NotificationType } from '@prisma/client';

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

@ObjectType()
export class NotificationModel {
  @Field(() => ID)
  id: string;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field()
  message: string;

  @Field()
  isRead: boolean;

  @Field(() => ID)
  userId: string;

  @Field(() => ID, { nullable: true })
  actorId?: string | null;

  @Field()
  createdAt: Date;
}
