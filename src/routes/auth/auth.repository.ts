import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { UserType } from 'src/shared/models/share-user.model'
import { RedisServices } from 'src/shared/services/redis.service'
import envConfig from 'src/shared/config/config'
import { AuthResponse, SupabaseClient } from '@supabase/supabase-js'
import { RoleName, Status } from 'src/shared/constants/role.constant'
import { SignupBodyType } from './schema/signup.schema'
import { LoginBodyType } from './schema/login.schema'

@Injectable()
export class AuthRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisServices,
    @Inject('SUPABASE') private supabase: SupabaseClient

  ) { }

  async signup(body: SignupBodyType) {
    const { data, error } = await this.supabase.auth.signUp({
      email: body.email,
      password: body.password,
      phone: body.phoneNumber,
      options: {
        data: {
          role: RoleName.Member,
          name: body.name,
          user_name: body.username,
        },
        // emailRedirectTo: `${envConfig.FRONTEND_URL}/auth/callback`
      }
    })

    await this.createUser({
      id: data.user.id,
      name: body.name,
      user_name: body.username,
      status: Status.Inactive,
    })
    return {
      data,
      error
    }
  }

  async createUser(user: UserType) {
    return await this.prismaService.user.create({
      data: {
        id: user.id,
        name: user.name,
        user_name: user.user_name,
      },
    })
  }

  async logIn(body: LoginBodyType) {
    const authResponse = await this.supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    const user = await this.prismaService.user.findUnique({
      where: {
        id: authResponse.data.user.id
      }
    })


    const { data: updatedUser } = await this.supabase.auth.updateUser({
      data: {
        role: user.role,
        name: user.name,
        user_name: user.user_name,
      }
    })


    return {
      data: {
        ...authResponse.data,
        user: updatedUser.user
      },
      error: authResponse.error
    }
  }

  async logOut() {
    const { error } = await this.supabase.auth.signOut({ scope: 'local' })
    return {
      error
    }
  }

  async refreshSession(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    return {
      data,
      error
    }
  }

  async verifyEmail(token: string) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    })
    return {
      data, error
    }
  }
}