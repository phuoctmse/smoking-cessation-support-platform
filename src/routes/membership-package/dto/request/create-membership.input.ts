import { Field, InputType, Int } from '@nestjs/graphql'
import { CreateMembershipPackageSchema } from '../../schema/create-membership.schema'
import { createZodDto } from 'nestjs-zod'

@InputType()
export class CreateMembershipPackageInput extends createZodDto(CreateMembershipPackageSchema) {
  @Field(() => String)
  name: string

  @Field(() => [String])
  description: string[]

  @Field(() => Int)
  price: number

  @Field(() => Int)
  duration_days: number

  @Field(() => Boolean, { defaultValue: true })
  is_active: boolean

  @Field(() => Date, { nullable: true })
  created_at?: Date

  @Field(() => Date, { nullable: true })
  updated_at?: Date
}
