import { Module } from '@nestjs/common';
import { TweetsEvents } from './tweets.events';
import { TweetsResolver } from './tweets.resolver';
import { TweetsService } from './tweets.service';

@Module({
  providers: [TweetsEvents, TweetsResolver, TweetsService],
  exports: [TweetsEvents, TweetsService],
})
export class TweetsModule {}
