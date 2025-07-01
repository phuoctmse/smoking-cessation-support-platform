import { ObjectType, Field, Int } from '@nestjs/graphql'

@ObjectType()
export class MemberProfile {
  @Field(() => String)
  id: string

  @Field(() => String)
  user_id: string

  @Field(() => Int, { nullable: true })
  cigarettes_per_day?: number

  @Field(() => Int, { nullable: true })
  sessions_per_day?: number

  @Field(() => Int, { nullable: true })
  price_per_pack?: number

  @Field(() => Date, { nullable: true })
  recorded_at?: Date
} 