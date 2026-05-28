import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const existing = await this.prisma.follow.findFirst({ where: { followerId, followingId } });
    if (existing) {
      return true;
    }

    const target = await this.prisma.user.findFirst({ where: { id: followingId, isDeleted: false } });
    if (!target) {
      throw new NotFoundException('User to follow not found');
    }

    await this.prisma.follow.create({ data: { followerId, followingId } });
    return true;
  }

  async unfollow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot unfollow yourself');
    }

    const result = await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
    return result.count > 0;
  }

  async getFollowers(userId: string): Promise<any[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            email: true,
            bio: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
            isDeleted: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows
      .map((r) => r.follower)
      .filter((u) => !u.isDeleted)
      .map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
  }

  async getFollowing(userId: string): Promise<any[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            email: true,
            bio: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
            isDeleted: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows
      .map((r) => r.following)
      .filter((u) => !u.isDeleted)
      .map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
  }
}