import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsEvents } from './notifications.events';
import { NotificationsGateway } from './notifications.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    NotificationsService,
    NotificationsResolver,
    NotificationsEvents,
    NotificationsGateway,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
