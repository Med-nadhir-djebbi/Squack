import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagesEvents } from './messages.events';
import { MessagesGateway } from './messages.gateway';
import { MessagesResolver } from './messages.resolver';
import { MessagesService } from './messages.service';

@Module({
  imports: [AuthModule],
  providers: [
    MessagesEvents,
    MessagesGateway,
    MessagesResolver,
    MessagesService,
  ],
  exports: [MessagesEvents, MessagesService],
})
export class MessagesModule {}
