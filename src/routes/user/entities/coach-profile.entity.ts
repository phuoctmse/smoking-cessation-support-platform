import { ObjectType, Field, Int } from '@nestjs/graphql'

@ObjectType()
export class CoachProfile {
  @Field(() => String)
  id: string

  @Field(() => String)
  user_id: string

  @Field(() => Int, { nullable: true })
  experience_years?: number

  @Field(() => String, { nullable: true })
  bio?: string
} 