import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { getAllowedOrigins } from '../config/cors.config';
import { UserModel } from '../users/models/user.model';
import { MessagesEvents } from './messages.events';
import { MessageType } from './messages.types';

interface MessagesSocketData {
  user?: UserModel;
}

@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnModuleInit, OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private readonly deliverMessage = (message: MessageType): void => {
    this.server
      .to(`user:${message.receiverId}`)
      .emit('message.received', message);
    this.server
      .to(`user:${message.senderId}`)
      .emit('message.sent.confirmed', message);
  };

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly events: MessagesEvents,
  ) {}

  onModuleInit(): void {
    this.events.onSent(this.deliverMessage);
  }

  onModuleDestroy(): void {
    this.events.offSent(this.deliverMessage);
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const handshakeAuth = client.handshake.auth as { token?: unknown };
      const authorization = client.handshake.headers.authorization;
      const value = handshakeAuth.token ?? authorization;

      if (typeof value !== 'string') {
        throw new Error('Missing socket token');
      }

      const token = value.startsWith('Bearer ') ? value.slice(7) : value;
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      const user = await this.authService.validateUser(payload.sub);
      const socketData = client.data as MessagesSocketData;

      socketData.user = user;
      await client.join(`user:${user.id}`);
    } catch {
      client.disconnect(true);
    }
  }
}
