import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthService } from '../auth/jwt-auth.service';
import { DomainEventsService } from '../common/events/domain-events.service';
import { MessageSentEvent } from '../common/events/domain-events.types';

interface MessagesSocketData {
  user?: AuthenticatedUser;
}

@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnModuleInit, OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private readonly deliverMessage = (message: MessageSentEvent): void => {
    this.server
      .to(`user:${message.receiverId}`)
      .emit('message.received', message);
    this.server
      .to(`user:${message.senderId}`)
      .emit('message.sent.confirmed', message);
  };

  constructor(
    private readonly jwtAuthService: JwtAuthService,
    private readonly events: DomainEventsService,
  ) {}

  onModuleInit(): void {
    this.events.on('message.sent', this.deliverMessage);
  }

  onModuleDestroy(): void {
    this.events.off('message.sent', this.deliverMessage);
  }

  handleConnection(client: Socket): void {
    try {
      const handshakeAuth = client.handshake.auth as { token?: unknown };
      const token =
        handshakeAuth.token ?? client.handshake.headers.authorization;
      const user = this.jwtAuthService.authenticateSocketToken(token);
      const socketData = client.data as MessagesSocketData;

      socketData.user = user;
      void client.join(`user:${user.id}`);
    } catch {
      client.disconnect(true);
    }
  }
}
