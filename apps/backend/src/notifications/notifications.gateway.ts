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
import { NotificationsEvents } from './notifications.events';
import { NotificationModel } from './notifications.types';

interface NotificationsSocketData {
  user?: UserModel;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnModuleInit, OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private readonly deliverNotification = (
    notification: NotificationModel,
  ): void => {
    this.server
      .to(`user:${notification.userId}`)
      .emit('notification.received', notification);
  };

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly events: NotificationsEvents,
  ) {}

  onModuleInit(): void {
    this.events.onCreated(this.deliverNotification);
  }

  onModuleDestroy(): void {
    this.events.offCreated(this.deliverNotification);
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
      const socketData = client.data as NotificationsSocketData;

      socketData.user = user;
      await client.join(`user:${user.id}`);
    } catch {
      client.disconnect(true);
    }
  }
}
