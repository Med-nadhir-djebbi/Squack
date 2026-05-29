import { Module } from '@nestjs/common';
import { TweetsEvents } from './tweets.events';
import { TweetsResolver } from './tweets.resolver';
import { TweetsService } from './tweets.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [TweetsEvents, TweetsResolver, TweetsService],
  exports: [TweetsEvents, TweetsService],
})
export class TweetsModule {}
