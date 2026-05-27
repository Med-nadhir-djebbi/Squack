import { Module } from '@nestjs/common';
import { GqlAuthGuard } from './gql-auth.guard';
import { JwtAuthService } from './jwt-auth.service';

@Module({
  providers: [JwtAuthService, GqlAuthGuard],
  exports: [JwtAuthService, GqlAuthGuard],
})
export class AuthModule {}
