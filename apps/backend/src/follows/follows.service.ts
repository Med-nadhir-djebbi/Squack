import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../users/users.select';

type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async follow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
      select: { id: true },
    });

    if (existing) {
      return true;
    }

    try {
      const notification = await this.prisma.$transaction(
        async (transaction) => {
          const [follower, target] = await Promise.all([
            transaction.user.findFirst({
              where: { id: followerId, isDeleted: false },
              select: { username: true },
            }),
            transaction.user.findFirst({
              where: { id: followingId, isDeleted: false },
              select: { id: true },
            }),
          ]);

          if (!follower) {
            throw new NotFoundException('Follower not found');
          }

          if (!target) {
            throw new NotFoundException('User to follow not found');
          }

          await transaction.follow.create({
            data: { followerId, followingId },
          });

          return this.notifications.createInTransaction(
            transaction,
            followingId,
            NotificationType.FOLLOW,
            '@' + follower.username + ' started following you',
            followerId,
          );
        },
      );

      this.notifications.publish(notification);
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return true;
      }

      throw error;
    }
  }

  async unfollow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot unfollow yourself');
    }

    const result = await this.prisma.follow.deleteMany({
      where: { followerId, followingId },
    });

    return result.count > 0;
  }

  async getFollowers(userId: string): Promise<PublicUser[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followingId: userId, follower: { isDeleted: false } },
      select: { follower: { select: publicUserSelect } },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => row.follower);
  }

  async getFollowing(userId: string): Promise<PublicUser[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId, following: { isDeleted: false } },
      select: { following: { select: publicUserSelect } },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => row.following);
  }
}
