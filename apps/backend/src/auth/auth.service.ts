import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: { username: string; email: string; password: string }) {
    const existingEmail = await this.usersService.findByEmail(data.email);
    if (existingEmail) {
      throw new BadRequestException('Email already in use');
    }

    const existingUsername = await this.usersService.findByUsername(data.username);
    if (existingUsername) {
      throw new BadRequestException('Username already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.createUser({
      username: data.username,
      email: data.email,
      password: hashedPassword,
    });

    const accessToken = await this.jwtService.signAsync({ sub: user.id });

    return { accessToken, user };
  }

  async login(data: { email: string; password: string }) {
    const userWithPassword = await this.usersService.findByEmail(data.email);
    if (!userWithPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(
      data.password,
      userWithPassword.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.usersService.findById(userWithPassword.id);
    const accessToken = await this.jwtService.signAsync({ sub: user.id });

    return { accessToken, user };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}
