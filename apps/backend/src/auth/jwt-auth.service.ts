import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, verify } from 'jsonwebtoken';
import { AuthenticatedUser } from './auth.types';

type SquackJwtPayload = JwtPayload & {
  id?: unknown;
  username?: unknown;
};

@Injectable()
export class JwtAuthService {
  constructor(private readonly configService: ConfigService) {}

  authenticateAuthorizationHeader(
    header: string | string[] | undefined,
  ): AuthenticatedUser {
    const authorization = Array.isArray(header) ? header[0] : header;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required');
    }

    return this.verifyToken(authorization.slice('Bearer '.length));
  }

  authenticateSocketToken(value: unknown): AuthenticatedUser {
    if (typeof value !== 'string' || value.length === 0) {
      throw new UnauthorizedException('Socket token is required');
    }

    const token = value.startsWith('Bearer ')
      ? value.slice('Bearer '.length)
      : value;

    return this.verifyToken(token);
  }

  private verifyToken(token: string): AuthenticatedUser {
    const secret =
      this.configService.get<string>('JWT_SECRET') ??
      'squack-local-development-secret';

    try {
      const payload = verify(token, secret);

      if (typeof payload === 'string') {
        throw new UnauthorizedException('Invalid authentication token');
      }

      return this.toAuthenticatedUser(payload);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private toAuthenticatedUser(payload: SquackJwtPayload): AuthenticatedUser {
    const id =
      typeof payload.sub === 'string'
        ? payload.sub
        : typeof payload.id === 'string'
          ? payload.id
          : null;

    if (!id) {
      throw new UnauthorizedException('Authentication token has no user id');
    }

    return {
      id,
      username:
        typeof payload.username === 'string' ? payload.username : undefined,
    };
  }
}
