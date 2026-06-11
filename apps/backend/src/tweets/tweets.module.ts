import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TweetsController } from './tweets.controller';
import { TweetsEvents } from './tweets.events';
import { TweetsResolver } from './tweets.resolver';
import { TweetsService } from './tweets.service';

@Module({
  imports: [NotificationsModule],
  controllers: [TweetsController],
  providers: [TweetsEvents, TweetsResolver, TweetsService],
  exports: [TweetsEvents, TweetsService],
})
export class TweetsModule {}
