import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';
import { UserModel } from '../users/models/user.model';
import { AuthService } from './auth.service';
import { AuthPayload } from './dto/auth.payload';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';

type AuthenticatedRequest = ExpressRequest & { user: UserModel };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() input: RegisterInput): Promise<AuthPayload> {
    return this.authService.register(input);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Request() request: AuthenticatedRequest): UserModel {
    return request.user;
  }
}
