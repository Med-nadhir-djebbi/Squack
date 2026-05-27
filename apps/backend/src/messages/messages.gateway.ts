import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesEvents } from './messages.events';
import { MessageType } from './messages.types';

interface MessagesSocketData {
  user?: {
    id?: string;
  };
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

  private readonly deliverMessage = (message: MessageType): void => {
    this.server
      .to(`user:${message.receiverId}`)
      .emit('message.received', message);
    this.server
      .to(`user:${message.senderId}`)
      .emit('message.sent.confirmed', message);
  };

  constructor(private readonly events: MessagesEvents) {}

  onModuleInit(): void {
    this.events.onSent(this.deliverMessage);
  }

  onModuleDestroy(): void {
    this.events.offSent(this.deliverMessage);
  }

  handleConnection(client: Socket): void {
    const socketData = client.data as MessagesSocketData;
    const userId = socketData.user?.id;

    if (!userId) {
      client.disconnect(true);
      return;
    }

    void client.join(`user:${userId}`);
  }
}
