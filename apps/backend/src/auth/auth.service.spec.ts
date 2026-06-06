/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user = {
    id: 'user-1',
    username: 'alice',
    bio: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let service: AuthService;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      createUser: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;
    jwtService = {
      signAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    service = new AuthService(usersService, jwtService);
  });

  it('normalizes credentials, hashes passwords, and signs a token', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findByUsername.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue(user);
    jwtService.signAsync.mockResolvedValue('token');

    const result = await service.register({
      username: ' alice ',
      email: ' Alice@Example.COM ',
      password: 'password123',
    });

    expect(usersService.findByEmail).toHaveBeenCalledWith('alice@example.com');
    expect(usersService.findByUsername).toHaveBeenCalledWith('alice');
    expect(usersService.createUser).toHaveBeenCalledWith({
      username: 'alice',
      email: 'alice@example.com',
      password: expect.any(String),
    });
    const created = usersService.createUser.mock.calls[0][0];
    await expect(bcrypt.compare('password123', created.password)).resolves.toBe(
      true,
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-1' });
    expect(result).toEqual({ accessToken: 'token', user });
  });

  it('rejects an unknown login without signing a token', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
