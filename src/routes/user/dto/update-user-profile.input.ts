import { InputType, Field } from '@nestjs/graphql'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { UserSchema } from '../schema/user.schema'
@InputType()
export class UpdateUserProfileInput extends createZodDto(UserSchema) {
  @Field(() => String)
  id: string

  @Field(() => String, { nullable: true })
  name?: string

  @Field(() => String, { nullable: true })
  user_name?: string

  @Field(() => String, { nullable: true })
  avatar_url?: string
} 