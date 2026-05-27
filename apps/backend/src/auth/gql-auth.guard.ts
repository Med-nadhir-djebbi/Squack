import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedRequest } from './auth.types';
import { JwtAuthService } from './jwt-auth.service';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly jwtAuthService: JwtAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const graphqlContext = GqlExecutionContext.create(context).getContext<{
      req: AuthenticatedRequest;
    }>();

    graphqlContext.req.user =
      this.jwtAuthService.authenticateAuthorizationHeader(
        graphqlContext.req.headers.authorization,
      );

    return true;
  }
}
