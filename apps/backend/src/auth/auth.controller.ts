import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserModel } from '../users/models/user.model';
import { AuthService } from './auth.service';
import { AuthPayload } from './dto/auth.payload';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() input: RegisterInput): Promise<AuthPayload> {
    return this.authService.register(input);
  }

  @Post('login')
  login(@Body() input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Request() request: { user: UserModel }): UserModel {
    return request.user;
  }
}
