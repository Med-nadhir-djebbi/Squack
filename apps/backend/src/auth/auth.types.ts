import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  username?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
