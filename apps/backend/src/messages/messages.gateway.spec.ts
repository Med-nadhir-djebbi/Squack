import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { MessagesEvents } from './messages.events';
import { MessagesGateway } from './messages.gateway';
import { MessageType } from './messages.types';

describe('MessagesGateway', () => {
  const message: MessageType = {
    id: 'message-1',
    content: 'Hello',
    senderId: 'user-1',
    receiverId: 'user-2',
    sender: { id: 'user-1', username: 'aziz', avatarUrl: null },
    receiver: { id: 'user-2', username: 'mouna', avatarUrl: null },
    createdAt: new Date('2026-05-27T18:00:00.000Z'),
  };

  let gateway: MessagesGateway;
  let events: MessagesEvents;
  let jwtService: { verifyAsync: jest.Mock };
  let authService: { validateUser: jest.Mock };

  beforeEach(() => {
    events = new MessagesEvents();
    jwtService = { verifyAsync: jest.fn() };
    authService = { validateUser: jest.fn() };
    gateway = new MessagesGateway(
      jwtService as unknown as JwtService,
      authService as unknown as AuthService,
      events,
    );
  });

  it('joins a socket after validating the bearer token through auth', async () => {
    const join = jest.fn();
    const disconnect = jest.fn();
    const client = {
      handshake: { auth: { token: 'token' }, headers: {} },
      data: {},
      join,
      disconnect,
    } as unknown as Socket;
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    authService.validateUser.mockResolvedValue({ id: 'user-1' });

    await gateway.handleConnection(client);

    expect(join).toHaveBeenCalledWith('user:user-1');
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('disconnects a socket when it has no bearer token', async () => {
    const disconnect = jest.fn();
    const client = {
      handshake: { auth: {}, headers: {} },
      data: {},
      join: jest.fn(),
      disconnect,
    } as unknown as Socket;
    await gateway.handleConnection(client);

    expect(disconnect).toHaveBeenCalledWith(true);
  });

  it('delivers stored messages to receiver and sender rooms', async () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as unknown as Server;
    gateway.onModuleInit();

    events.emitSent(message);
    await Promise.resolve();

    expect(to).toHaveBeenNthCalledWith(1, 'user:user-2');
    expect(emit).toHaveBeenNthCalledWith(1, 'message.received', message);
    expect(to).toHaveBeenNthCalledWith(2, 'user:user-1');
    expect(emit).toHaveBeenNthCalledWith(2, 'message.sent.confirmed', message);

    gateway.onModuleDestroy();
  });
});
