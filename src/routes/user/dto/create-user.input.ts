import { InputType, Field } from '@nestjs/graphql'
import { createZodDto } from 'nestjs-zod'
import { RoleNameEnum, StatusEnum } from 'src/shared/enums/graphql-enums'
import { z } from 'zod'
import { UserSchema } from '../schema/user.schema'
import { SignupBodySchema } from 'src/routes/auth/schema/signup.schema'

@InputType()
export class CreateUserInput extends createZodDto(SignupBodySchema) {
  @Field(() => String)
  name: string

  @Field(() => String)
  username: string

  @Field(() => String)
  email: string

  @Field(() => String)
  password: string

  @Field(() => String)
  confirmPassword: string

  @Field(() => String, { nullable: true })
  avatar_url?: string

  @Field(() => RoleNameEnum)
  role: RoleNameEnum

  @Field(() => StatusEnum)
  status: StatusEnum
}