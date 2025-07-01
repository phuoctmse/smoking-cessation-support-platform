import { ObjectType, Field } from '@nestjs/graphql'
import { RoleNameType, StatusType } from 'src/shared/constants/role.constant'
import { UserSchema } from '../schema/user.schema'
import { createZodDto } from 'nestjs-zod'
import { MemberProfile } from './member-profile.entity'
import { CoachProfile } from './coach-profile.entity'

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

  @Field(() => String)
  role: RoleNameType

  @Field(() => String)
  status: StatusType

  @Field(() => Date)
  created_at: Date

  @Field(() => Date)
  updated_at: Date

  @Field(() => MemberProfile, { nullable: true })
  member_profile?: MemberProfile

  @Field(() => CoachProfile, { nullable: true })
  coach_profile?: CoachProfile
}