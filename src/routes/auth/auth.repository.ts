import { Inject, Injectable } from '@nestjs/common'
import { SupabaseClient } from '@supabase/supabase-js'
import { PrismaService } from 'src/shared/services/prisma.service'
import { SignupBodyType } from './schema/signup.schema'
import { RoleNameEnum, StatusEnum } from 'src/shared/enums/graphql-enums'
import envConfig from 'src/shared/config/config'
import { LoginBodyType } from './schema/login.schema'
import { CreateUserInput } from '../user/dto/create-user.input'

@Injectable()
export class AuthRepository {
  constructor(
    @Inject('SUPABASE') private readonly supabase: SupabaseClient,
    private readonly prismaService: PrismaService
  ) { }

  async signup(body: SignupBodyType) {
    const { data, error } = await this.supabase.auth.signUp({
      email: body.email,
      password: body.password,
      phone: body.phoneNumber,
      options: {
        data: {
          role: RoleNameEnum.MEMBER,
          name: body.name,
          user_name: body.username,
        },
        emailRedirectTo: `${envConfig.FRONTEND_URL}/auth/callback?type=signup`
      }
    })

    await this.createUser({
      id: data.user.id,
      name: body.name,
      user_name: body.username,
      status: StatusEnum.ACTIVE,
    })
    return {
      data,
      error
    }
  }

  async signupByAdmin(body: CreateUserInput) {
    const { data, error } = await this.supabase.auth.signUp({
      email: body.email,
      password: body.password,
      phone: body.phoneNumber,
      options: {
        data: {
          role: body.role,
          name: body.name,
          user_name: body.username,
        },
        emailRedirectTo: `${envConfig.FRONTEND_URL}/auth/callback?type=signup`
      }
    })

    if (error) {
      throw error
    }

    try {
      if (body.role === RoleNameEnum.COACH) {
        const user = await this.prismaService.$transaction(async (prisma) => {
          await prisma.user.create({
            data: {
              id: data.user.id,
              name: body.name,
              user_name: body.username,
              status: body.status,
              role: RoleNameEnum.COACH
            }
          })
          await prisma.coachProfile.create({
            data: {
              id: data.user.id,
              user_id: data.user.id,
              experience_years: 0,
              bio: '',
            }
          })
        })
      } else if (body.role === RoleNameEnum.MEMBER) {
        const user = await this.prismaService.$transaction(async (prisma) => {
          await prisma.user.create({
            data: {
              id: data.user.id,
              name: body.name,
              user_name: body.username,
              status: body.status,
              role: RoleNameEnum.MEMBER
            }
          })
          await prisma.memberProfile.create({
            data: {
              id: data.user.id,
              user_id: data.user.id,
              cigarettes_per_day: 0,
              sessions_per_day: 0,
              price_per_pack: 0,
              recorded_at: new Date(),
            }
          })
        })
      }
    } catch (error) {
      // If there's an error creating the user in our database, delete the user from Supabase
      await this.supabase.auth.admin.deleteUser(data.user.id)
      throw error
    }

    return {
      data,
      error
    }
  }
  
  async handleEmailVerification(access_token: string) {
    const { data: { user } } = await this.supabase.auth.getUser(access_token)

    if (!user) {
      throw new Error('User not found')
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { status: StatusEnum.ACTIVE }
    })

    return user
  }

  private async createUser(data: {
    id: string
    name: string
    user_name: string
    status: StatusEnum
  }) {
    return this.prismaService.$transaction(async (prisma) => {
      await prisma.user.create({
        data: {
          id: data.id,
          name: data.name,
          user_name: data.user_name,
          status: data.status,
          role: RoleNameEnum.MEMBER
        }
      })
      await prisma.memberProfile.create({
        data: {
          id: data.id,
          user_id: data.id,
          cigarettes_per_day: 0,
          sessions_per_day: 0,
          price_per_pack: 0,
          recorded_at: new Date(),
        }
      })
    })
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
}