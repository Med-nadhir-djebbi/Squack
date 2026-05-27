import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email, isDeleted: false } });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findFirst({ where: { username, isDeleted: false } });
  }

  async createUser(data: { username: string; email: string; password: string }) {
    return this.prisma.user.create({
      data,
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(
    id: string,
    data: { bio?: string; avatarUrl?: string },
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
