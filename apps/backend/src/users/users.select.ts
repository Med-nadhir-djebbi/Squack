import { Prisma } from '@prisma/client';

export const publicUserSelect = {
  id: true,
  username: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;
