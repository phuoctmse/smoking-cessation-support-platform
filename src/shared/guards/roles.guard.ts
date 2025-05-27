import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RoleNameType } from '../constants/role.constant'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { GqlExecutionContext } from '@nestjs/graphql'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleNameType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) {
      return true
    }

    const ctx = GqlExecutionContext.create(context)
    const request = ctx.getContext().req

    // The user should already be set by JwtAuthGuard
    const user = request.user

    if (!user || !user.role) {
      return false
    }

    return requiredRoles.some((role) => user.role === role)
  }
}