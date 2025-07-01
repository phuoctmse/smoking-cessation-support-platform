import { Injectable } from '@nestjs/common'
import { CreateUserInput } from './dto/create-user.input'
import { UpdateUserInput } from './dto/update-user.input'
import { PrismaService } from 'src/shared/services/prisma.service'
import { UserRepo } from './user.repo'
import { UpdateUserProfileInput } from './dto/update-user-profile.input'

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepo) { }
  async createUser(createUserInput: CreateUserInput) {
    return await this.userRepo.createUser(createUserInput)
  }

  async findAll() {
    return await this.userRepo.findAll()
  }

  async findOne(id: string) {
    return await this.userRepo.findOne(id)
  }

  async updateProfile(id: string, updateUserInput: UpdateUserProfileInput) {
    return await this.userRepo.update(id, updateUserInput)
  }

  async updateByAdmin(id: string, updateUserInput: UpdateUserInput) {
    return await this.userRepo.updateByAdmin(id, updateUserInput)
  }

  async removeByAdmin(id: string) {
    const result = await this.userRepo.removeByAdmin(id)
    if (result) {
      return {
        message: 'User removed successfully'
      }
    }
    return {
      message: 'delete failed'
    }
  }
}
