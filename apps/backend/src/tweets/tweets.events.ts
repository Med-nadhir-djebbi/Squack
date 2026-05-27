import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { TweetType } from './tweets.types';

@Injectable()
export class TweetsEvents {
  private readonly emitter = new EventEmitter();
  private readonly logger = new Logger(TweetsEvents.name);

  emitCreated(tweet: TweetType): void {
    const listeners = this.emitter.listeners('tweet.created') as Array<
      (value: TweetType) => void
    >;

    for (const listener of listeners) {
      void Promise.resolve()
        .then(() => listener(tweet))
        .catch((error: unknown) => {
          const trace = error instanceof Error ? error.stack : undefined;
          this.logger.error('Handler failed for tweet.created', trace);
        });
    }
  }

  onCreated(listener: (tweet: TweetType) => void): void {
    this.emitter.on('tweet.created', listener);
  }

  offCreated(listener: (tweet: TweetType) => void): void {
    this.emitter.off('tweet.created', listener);
  }
}
