import { NotificationsEvents } from './notifications.events';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  it('scopes read updates to the authenticated user', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      notification: { updateMany },
    } as unknown as PrismaService;
    const events = {} as NotificationsEvents;
    const service = new NotificationsService(prisma, events);

    await expect(service.markAsRead('user-1', 'notification-1')).resolves.toBe(
      true,
    );
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'notification-1', userId: 'user-1' },
      data: { isRead: true },
    });
  });
});
