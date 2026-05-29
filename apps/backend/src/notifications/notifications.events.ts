import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { NotificationModel } from './notifications.types';

@Injectable()
export class NotificationsEvents {
  private readonly emitter = new EventEmitter();
  private readonly logger = new Logger(NotificationsEvents.name);

  emitCreated(notification: NotificationModel): void {
    const listeners = this.emitter.listeners('notification.created') as Array<
      (value: NotificationModel) => void
    >;

    for (const listener of listeners) {
      void Promise.resolve()
        .then(() => listener(notification))
        .catch((error: unknown) => {
          const trace = error instanceof Error ? error.stack : undefined;
          this.logger.error('Handler failed for notification.created', trace);
        });
    }
  }

  onCreated(listener: (notification: NotificationModel) => void): void {
    this.emitter.on('notification.created', listener);
  }

  offCreated(listener: (notification: NotificationModel) => void): void {
    this.emitter.off('notification.created', listener);
  }
}
