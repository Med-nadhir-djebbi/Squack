import { Server, Socket } from 'socket.io';
import { JwtAuthService } from '../auth/jwt-auth.service';
import { DomainEventsService } from '../common/events/domain-events.service';
import { MessageSentEvent } from '../common/events/domain-events.types';
import { MessagesGateway } from './messages.gateway';

describe('MessagesGateway', () => {
  const message: MessageSentEvent = {
    id: 'message-1',
    content: 'Hello',
    senderId: 'user-1',
    receiverId: 'user-2',
    sender: { id: 'user-1', username: 'aziz', avatarUrl: null },
    receiver: { id: 'user-2', username: 'mouna', avatarUrl: null },
    createdAt: new Date('2026-05-27T18:00:00.000Z'),
  };

  let gateway: MessagesGateway;
  let jwtAuthService: { authenticateSocketToken: jest.Mock };
  let events: DomainEventsService;

  beforeEach(() => {
    jwtAuthService = { authenticateSocketToken: jest.fn() };
    events = new DomainEventsService();
    gateway = new MessagesGateway(
      jwtAuthService as unknown as JwtAuthService,
      events,
    );
  });

  it('joins an authenticated socket to its private room', () => {
    const join = jest.fn();
    const disconnect = jest.fn();
    const client = {
      handshake: { auth: { token: 'token' }, headers: {} },
      data: {},
      join,
      disconnect,
    } as unknown as Socket;
    jwtAuthService.authenticateSocketToken.mockReturnValue({ id: 'user-1' });

    gateway.handleConnection(client);

    expect(join).toHaveBeenCalledWith('user:user-1');
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('disconnects an unauthenticated socket', () => {
    const disconnect = jest.fn();
    const client = {
      handshake: { auth: {}, headers: {} },
      data: {},
      join: jest.fn(),
      disconnect,
    } as unknown as Socket;
    jwtAuthService.authenticateSocketToken.mockImplementation(() => {
      throw new Error('invalid');
    });

    gateway.handleConnection(client);

    expect(disconnect).toHaveBeenCalledWith(true);
  });

  it('delivers stored messages to receiver and sender rooms', async () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as unknown as Server;
    gateway.onModuleInit();

    events.emit('message.sent', message);
    await Promise.resolve();

    expect(to).toHaveBeenNthCalledWith(1, 'user:user-2');
    expect(emit).toHaveBeenNthCalledWith(1, 'message.received', message);
    expect(to).toHaveBeenNthCalledWith(2, 'user:user-1');
    expect(emit).toHaveBeenNthCalledWith(2, 'message.sent.confirmed', message);

    gateway.onModuleDestroy();
  });
});
