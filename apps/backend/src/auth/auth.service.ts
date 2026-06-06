import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: { username: string; email: string; password: string }) {
    const email = data.email.trim().toLowerCase();
    const username = data.username.trim();
    const existingEmail = await this.usersService.findByEmail(email);

    if (existingEmail) {
      throw new BadRequestException('Email already in use');
    }

    const existingUsername = await this.usersService.findByUsername(username);

    if (existingUsername) {
      throw new BadRequestException('Username already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    try {
      const user = await this.usersService.createUser({
        username,
        email,
        password: hashedPassword,
      });
      const accessToken = await this.jwtService.signAsync({ sub: user.id });

      return { accessToken, user };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Email or username already in use');
      }

      throw error;
    }
  }

  async login(data: { email: string; password: string }) {
    const userWithPassword = await this.usersService.findByEmail(
      data.email.trim().toLowerCase(),
    );

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
