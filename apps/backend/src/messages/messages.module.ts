import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagesGateway } from './messages.gateway';
import { MessagesResolver } from './messages.resolver';
import { MessagesService } from './messages.service';

@Module({
  imports: [AuthModule],
  providers: [MessagesGateway, MessagesResolver, MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
