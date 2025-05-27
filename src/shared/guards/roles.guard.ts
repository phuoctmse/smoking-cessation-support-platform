import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RoleNameType } from '../constants/role.constant'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { GqlExecutionContext } from '@nestjs/graphql'
import { extractAccessToken } from '../helpers/function.helper'
import { TokenService } from '../services/token.service'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleNameType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles) {
      return true
    }
    const ctx = GqlExecutionContext.create(context)
    const request = ctx.getContext().req
    const accessToken = extractAccessToken(request)
    const decodedAccessToken = await this.tokenService.verifyAccessToken(accessToken)
    return requiredRoles.some((role) => decodedAccessToken.user_metadata.role === role)
  }
}
