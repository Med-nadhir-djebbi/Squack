import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { DomainEventMap } from './domain-events.types';

@Injectable()
export class DomainEventsService {
  private readonly emitter = new EventEmitter();
  private readonly logger = new Logger(DomainEventsService.name);

  emit<TEvent extends keyof DomainEventMap>(
    eventName: TEvent,
    payload: DomainEventMap[TEvent],
  ): void {
    const listeners = this.emitter.listeners(eventName) as Array<
      (event: DomainEventMap[TEvent]) => void
    >;

    for (const listener of listeners) {
      void Promise.resolve()
        .then(() => listener(payload))
        .catch((error: unknown) => {
          const trace = error instanceof Error ? error.stack : undefined;
          this.logger.error(`Handler failed for ${eventName}`, trace);
        });
    }
  }

  on<TEvent extends keyof DomainEventMap>(
    eventName: TEvent,
    listener: (payload: DomainEventMap[TEvent]) => void,
  ): void {
    this.emitter.on(eventName, listener);
  }

  off<TEvent extends keyof DomainEventMap>(
    eventName: TEvent,
    listener: (payload: DomainEventMap[TEvent]) => void,
  ): void {
    this.emitter.off(eventName, listener);
  }
}
