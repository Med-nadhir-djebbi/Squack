import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModel } from './notifications.types';
import { NotificationsEvents } from './notifications.events';

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

  async createNotification(
    userId: string,
    type: NotificationType,
    message: string,
  ): Promise<NotificationModel> {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        message,
      },
    });

    this.events.emitCreated(notification);

    return notification;
  }
}
