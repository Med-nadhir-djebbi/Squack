import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TweetsResolver } from './tweets.resolver';
import { TweetsService } from './tweets.service';

@Module({
  imports: [AuthModule],
  providers: [TweetsResolver, TweetsService],
  exports: [TweetsService],
})
export class TweetsModule {}
