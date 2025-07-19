import { ObjectType, Field } from '@nestjs/graphql'
import { RoleNameType, StatusType } from 'src/shared/constants/role.constant'
import { UserSchema } from '../schema/user.schema'
import { createZodDto } from 'nestjs-zod'
import { MemberProfile } from './member-profile.entity'
import { CoachProfile } from './coach-profile.entity'
import { RoleNameEnum, StatusEnum } from 'src/shared/enums/graphql-enums'

@ObjectType()
export class User extends createZodDto(UserSchema) {
  @Field(() => String)
  id: string

  @Field(() => String)
  user_name: string

  @Field(() => String)
  name: string

  @Field(() => String, { nullable: true })
  avatar_url?: string

  @Field(() => RoleNameEnum)
  role: RoleNameEnum

  @Field(() => StatusEnum)
  status: StatusEnum

  @Field(() => Date)
  created_at: Date

  @Field(() => Date)
  updated_at: Date

  @Field(() => [MemberProfile], { nullable: true, name: 'member_profile' })
  MemberProfile?: MemberProfile[]

  @Field(() => [CoachProfile], { nullable: true, name: 'coach_profile' })
  CoachProfile?: CoachProfile[]
}