import { Module } from '@nestjs/common';
import { MessagesEvents } from './messages.events';
import { MessagesGateway } from './messages.gateway';
import { MessagesResolver } from './messages.resolver';
import { MessagesService } from './messages.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NotificationsModule, AuthModule],
  providers: [
    MessagesEvents,
    MessagesGateway,
    MessagesResolver,
    MessagesService,
  ],
  exports: [MessagesEvents, MessagesService],
})
export class MessagesModule {}
