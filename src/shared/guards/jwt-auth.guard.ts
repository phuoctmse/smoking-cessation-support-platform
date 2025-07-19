import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { SupabaseClient } from '@supabase/supabase-js'
import { BlacklistGuard } from './blacklist.guard'
import { GqlExecutionContext } from '@nestjs/graphql'
import { extractAccessToken } from '../helpers/function.helper'
import { PrismaService } from '../services/prisma.service'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject('SUPABASE') private supabase: SupabaseClient,
    private readonly blacklistGuard: BlacklistGuard,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context)
    const contextValue = ctx.getContext()

    let accessToken: string | undefined

    // Handle both HTTP and WebSocket contexts
    if (contextValue.req?.connectionParams) {
      // WebSocket Connection
      accessToken = contextValue.req.connectionParams.Authorization?.replace('Bearer ', '')
    } else if (contextValue.req) {
      // HTTP Request
      accessToken = extractAccessToken(contextValue.req)
    }

    if (!accessToken) {
      throw new UnauthorizedException('Missing access token')
    }

    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.blacklistGuard.isBlackList(accessToken)

      if (isBlacklisted) {
        throw new UnauthorizedException('Token is blacklisted')
      }

      // Verify the token with Supabase
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(accessToken)

      if (error || !user) {
        throw new UnauthorizedException('Invalid or expired token')
      }

      // Get user role from your database using Prisma
      const userData = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          role: true,
          status: true,
          name: true,
          user_name: true,
        },
      })

      if (!userData) {
        throw new UnauthorizedException('User not found in database')
      }

      const userInfo = {
        user_id: user.id,
        email: user.email,
        role: userData.role,
        username: userData.user_name,
        name: userData.name,
        status: userData.status,
      }

      // Set user info in the appropriate context
      if (contextValue.req?.connectionParams) {
        // For WebSocket, set user directly in context
        contextValue.user = userInfo
      } else {
        // For HTTP, set user in req object
        contextValue.req.user = userInfo
      }

      return true
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new UnauthorizedException('Authentication failed')
    }
  }
}