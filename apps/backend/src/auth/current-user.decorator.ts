import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedRequest, AuthenticatedUser } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const graphqlContext = GqlExecutionContext.create(context).getContext<{
      req: AuthenticatedRequest;
    }>();

    return graphqlContext.req.user as AuthenticatedUser;
  },
);
