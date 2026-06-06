import { Injectable } from '@nestjs/common';
import { Notification, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsEvents } from './notifications.events';
import { NotificationModel } from './notifications.types';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: NotificationsEvents,
  ) {}

  async findAll(userId: string): Promise<NotificationModel[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });

    return result.count > 0;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return true;
  }

  createInTransaction(
    transaction: Prisma.TransactionClient,
    userId: string,
    type: NotificationType,
    message: string,
    actorId?: string,
  ): Promise<Notification> {
    return transaction.notification.create({
      data: { actorId, message, type, userId },
    });
  }

  publish(notification: NotificationModel): void {
    this.events.emitCreated(notification);
  }
}
