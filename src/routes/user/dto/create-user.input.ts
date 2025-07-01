import { InputType, Int, Field } from '@nestjs/graphql'
import { createZodDto } from 'nestjs-zod'
import { UserSchema } from '../schema/user.schema'
import { RoleNameType, StatusType } from 'src/shared/constants/role.constant'

@InputType()
export class CreateUserInput extends createZodDto(UserSchema) {
  @Field(() => String)
  name: string

  @Field(() => String)
  user_name: string

  @Field(() => String, { nullable: true })
  avatar_url?: string

  @Field(() => String)
  role: RoleNameType

  @Field(() => String)
  status: StatusType

  @Field(() => Date)
  created_at: Date

  @Field(() => Date)
  updated_at: Date
}
