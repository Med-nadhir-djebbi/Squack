import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { MessageType } from './messages.types';

@Injectable()
export class MessagesEvents {
  private readonly emitter = new EventEmitter();
  private readonly logger = new Logger(MessagesEvents.name);

  emitSent(message: MessageType): void {
    const listeners = this.emitter.listeners('message.sent') as Array<
      (value: MessageType) => void
    >;

    for (const listener of listeners) {
      void Promise.resolve()
        .then(() => listener(message))
        .catch((error: unknown) => {
          const trace = error instanceof Error ? error.stack : undefined;
          this.logger.error('Handler failed for message.sent', trace);
        });
    }
  }

  onSent(listener: (message: MessageType) => void): void {
    this.emitter.on('message.sent', listener);
  }

  offSent(listener: (message: MessageType) => void): void {
    this.emitter.off('message.sent', listener);
  }
}
