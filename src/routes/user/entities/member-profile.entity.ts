import { ObjectType, Field, Int, Float } from '@nestjs/graphql'
import { GraphQLJSON } from 'graphql-type-json'

@ObjectType()
export class MemberProfile {
  @Field(() => String)
  id: string

  @Field(() => String)
  user_id: string

  // Thông tin về thói quen hút thuốc
  @Field(() => Int, { nullable: true })
  cigarettes_per_day?: number

  @Field(() => Int, { nullable: true })
  cigarettes_per_pack?: number

  @Field(() => Int, { nullable: true })
  sessions_per_day?: number

  @Field(() => Int, { nullable: true })
  price_per_pack?: number

  @Field(() => Int, { nullable: true })
  smoking_years?: number

  @Field(() => String, { nullable: true })
  brand_preference?: string

  @Field(() => Float, { nullable: true })
  nicotine_level?: number

  // Thông tin sức khỏe
  @Field(() => [String], { nullable: true })
  health_conditions?: string[]

  @Field(() => [String], { nullable: true })
  allergies?: string[]

  @Field(() => [String], { nullable: true })
  medications?: string[]

  // Thông tin cho hệ thống gợi ý
  @Field(() => String, { nullable: true })
  quit_motivation?: string

  @Field(() => Int, { nullable: true })
  previous_attempts?: number

  @Field(() => [String], { nullable: true })
  preferred_support?: string[]

  @Field(() => Int, { nullable: true })
  stress_level?: number

  @Field(() => GraphQLJSON, { nullable: true })
  daily_routine?: any

  @Field(() => Boolean, { nullable: true })
  social_support?: boolean

  @Field(() => [String], { nullable: true })
  trigger_factors?: string[]

  @Field(() => Date, { nullable: true })
  recorded_at?: Date
} 