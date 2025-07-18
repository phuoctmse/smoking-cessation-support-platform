import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { UserService } from './user.service'
import { User } from './entities/user.entity'
import { CreateUserInput } from './dto/create-user.input'
import { UpdateUserInput } from './dto/update-user.input'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard'
import { Roles } from 'src/shared/decorators/roles.decorator'
import { RoleName } from 'src/shared/constants/role.constant'
import { RolesGuard } from 'src/shared/guards/roles.guard'
import { UpdateUserProfileInput } from './dto/update-user-profile.input'
import { SignupBodySchema, SignupBodyType } from '../auth/schema/signup.schema'
import { AuthResponse } from '../auth/dto/response/auth.response'
import { CurrentUser } from 'src/shared/decorators/current-user.decorator'
import { UserType } from './schema/user.schema'
import { CoachProfile } from './entities/coach-profile.entity'

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  //Member & Coach
  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'COACH')
  async updateUserProfile(
    @Args('updateUserInput') updateUserInput: UpdateUserProfileInput,
    @CurrentUser() user: UserType,
  ) {
    return await this.userService.updateProfile(user.id, updateUserInput)
  }

  @Query(() => User, { name: 'findOneUser' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'COACH', 'ADMIN')
  async findOneUser(@CurrentUser() user: UserType) {
    return await this.userService.findOne(user.id)
  }

  @Query(() => User, { name: 'findUserById' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'COACH', 'ADMIN')
  async findUserById(@Args('userId') userId: string) {
    return await this.userService.findOne(userId)
  }

  @Query(() => [User], { name: 'findAllCoaches' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'COACH', 'ADMIN')
  async findAllCoaches() {
    return await this.userService.findAllCoaches()
  }

  //Admin
  @Mutation(() => AuthResponse)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createUserByAdmin(
    @Args('createUserInput', { type: () => CreateUserInput })
    createUserInput: CreateUserInput,
  ) {
    return await this.userService.createUser(createUserInput)
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateUserByAdmin(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return await this.userService.updateByAdmin(updateUserInput.id, updateUserInput)
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async removeUserByAdmin(@Args('id', { type: () => String }) id: string) {
    return await this.userService.removeByAdmin(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Query(() => [User], { name: 'GetAllUsers' })
  async findAllUsers() {
    return await this.userService.findAll()
  } 

}
