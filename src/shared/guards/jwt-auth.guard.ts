import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import * as jwt from 'jsonwebtoken'
import envConfig from '../config/config'
import { BlacklistGuard } from './blacklist.guard'
import { extractAccessToken } from '../helpers/function.helper'
import { TokenService } from '../services/token.service'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly blacklistGuard: BlacklistGuard,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get request from GraphQL context
    const ctx = GqlExecutionContext.create(context)
    const request = ctx.getContext().req

    // Extract tokens
    const accessToken = extractAccessToken(request)
    const refreshToken = request.cookies?.refreshToken

    // Validate both tokens exist
    if (!accessToken || !refreshToken) {
      throw new UnauthorizedException('Missing access or refresh token')
    }

    // Check if tokens are blacklisted
    await this.checkBlacklist(accessToken, refreshToken)

    // Verify JWT token
    try {
      const payload = await this.tokenService.verifyAccessToken(accessToken)
      request['user'] = payload
      return true
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token')
    }
  }

  private async checkBlacklist(accessToken: string, refreshToken: string): Promise<void> {
    const isBlacklistedAccess = await this.blacklistGuard.isBlackList(accessToken)
    const isBlacklistedRefresh = await this.blacklistGuard.isBlackList(refreshToken)

    if (isBlacklistedAccess || isBlacklistedRefresh) {
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}
