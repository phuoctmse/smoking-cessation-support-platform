import { ObjectType, Field, Int } from '@nestjs/graphql'
import { RoleName, RoleNameType, Status, StatusType } from 'src/shared/constants/role.constant'
import { UserType } from 'src/shared/models/share-user.model'

@ObjectType()
export class User implements UserType {
  @Field(() => String)
  id: string

  @Field(() => String)
  email: string

  @Field(() => String)
  username: string

  @Field(() => String)
  name: string

  @Field(() => String, { nullable: true })
  avatar_url?: string

  @Field(() => String)
  password: string

  @Field(() => String)
  role: RoleNameType

  @Field(() => String)
  status: StatusType

  @Field(() => Int, { nullable: true })
  cigarettes_per_day?: number

  @Field(() => Int, { nullable: true })
  sessions_per_day?: number

  @Field(() => Int, { nullable: true })
  price_per_pack?: number

  @Field(() => Date, { nullable: true })
  recorded_at?: Date

  @Field(() => Date)
  created_at: Date

  @Field(() => Date)
  updated_at: Date
}
