import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const gqlContext = GqlExecutionContext.create(ctx).getContext();
    const jwtUser = gqlContext.req.user || gqlContext.req['user'];

    if (!jwtUser) {
      console.error('User not found in request', {
        headers: gqlContext.req.headers,
        cookies: gqlContext.req.cookies
      });
      return null;
    }

    return {
      id: jwtUser.user_id,
      role: jwtUser.role,
      email: jwtUser.email,
      username: jwtUser.username,
      status: jwtUser.status
    };
  },
);