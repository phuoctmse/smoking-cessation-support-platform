import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const gqlContext = GqlExecutionContext.create(ctx).getContext()
  const user = gqlContext.req.user

  if (!user) {
    return null
  }

  return {
    id: user.user_id,
    role: user.role,
    email: user.email,
    username: user.username,
    name: user.name,
    status: user.status,
  }
})