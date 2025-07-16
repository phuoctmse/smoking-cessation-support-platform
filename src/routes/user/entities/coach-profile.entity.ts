import { ObjectType, Field, Int, Float } from '@nestjs/graphql'

@ObjectType()
export class CoachProfile {
  @Field(() => String)
  id: string

  @Field(() => String)
  user_id: string

  // Thông tin chuyên môn
  @Field(() => Int, { nullable: true })
  experience_years?: number

  @Field(() => [String], { nullable: true })
  specializations?: string[]

  @Field(() => [String], { nullable: true })
  certifications?: string[]

  @Field(() => String, { nullable: true })
  education?: string

  @Field(() => String, { nullable: true })
  professional_bio?: string

  // Thống kê hiệu quả
  @Field(() => Float, { nullable: true })
  success_rate?: number

  @Field(() => Int, { nullable: true })
  total_clients?: number

  @Field(() => Float, { nullable: true })
  average_rating?: number

  @Field(() => Int, { nullable: true })
  total_sessions?: number

  // Thông tin bổ sung
  @Field(() => String, { nullable: true })
  approach_description?: string

  @Field(() => Date)
  created_at: Date

  @Field(() => Date, { nullable: true })
  updated_at?: Date
} 