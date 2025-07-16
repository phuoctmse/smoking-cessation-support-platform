import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CoachProfileType, MemberProfileType, UserType } from './schema/user.schema'
import { UpdateUserInput } from './dto/update-user.input'
import { UpdateUserProfileInput } from './dto/update-user-profile.input'
import { CreateUserInput } from './dto/create-user.input'
import { SupabaseClient } from '@supabase/supabase-js'
import { RoleNameEnum } from 'src/shared/enums/graphql-enums'

@Injectable()
export class UserRepository {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject('SUPABASE') private readonly supabase: SupabaseClient,
  ) {}

  async findAll() {
    return await this.prismaService.user.findMany()
  }

  async findOne(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
      include: {
        MemberProfile: true,
        CoachProfile: true,
      }
    })
    
    if (!user) {
      throw new Error(`User with id ${id} not found`)
    }
    
    console.log(user)
    return user
  }

  async updateByAdmin(id: string, updateUserInput: UpdateUserInput) {
    return await this.prismaService.user.update({
      where: {
        id,
      },
      data: updateUserInput,
    })
  }

  async updateProfile(id: string, updateUserInput: UpdateUserProfileInput) {
    return await this.prismaService.user.update({
      where: {
        id,
      },
      data: updateUserInput,
    })
  }

  async removeByAdmin(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    })

    if (user.role === RoleNameEnum.MEMBER) {
      await this.prismaService.memberProfile.deleteMany({
        where: {
          user_id: id,
        },
      })
    } else if (user.role === RoleNameEnum.COACH) {
      await this.prismaService.coachProfile.deleteMany({
        where: {
          user_id: id,
        },
      })
    }

    await this.supabase.auth.admin.deleteUser(id)

    return await this.prismaService.user.delete({
      where: {
        id,
      },
    })
  }
}
