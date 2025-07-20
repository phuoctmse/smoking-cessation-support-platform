import { ObjectType, Field, Int, ID } from '@nestjs/graphql'

@ObjectType()
export class TemplateUsageStatsByStatus {
  @Field(() => String)
  status: string

  @Field(() => Int)
  count: number
}

@ObjectType()
export class TemplateUsageUser {
  @Field(() => ID)
  id: string

  @Field(() => String)
  name: string

  @Field(() => String)
  user_name: string

  @Field(() => String, { nullable: true })
  avatar_url?: string
}

@ObjectType()
export class TemplateUserDetail {
  @Field(() => ID)
  id: string

  @Field(() => String)
  user_id: string

  @Field(() => String)
  status: string

  @Field(() => Date)
  start_date: Date

  @Field(() => Date)
  target_date: Date

  @Field(() => Number)
  completion_percentage: number

  @Field(() => Int)
  days_since_start: number

  @Field(() => Int)
  days_to_target: number

  @Field(() => Boolean)
  is_overdue: boolean

  @Field(() => TemplateUsageUser)
  user: TemplateUsageUser
}

@ObjectType()
export class PaginatedTemplateUsersResponse {
  @Field(() => [TemplateUserDetail])
  data: TemplateUserDetail[]

  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  limit: number

  @Field(() => Boolean)
  hasNext: boolean
}

@ObjectType()
export class TemplateUsageStatsResponse {
  @Field(() => String)
  template_id: string

  @Field(() => String)
  template_name: string

  @Field(() => Int)
  total_users: number

  @Field(() => [TemplateUsageStatsByStatus])
  stats_by_status: TemplateUsageStatsByStatus[]

  @Field(() => PaginatedTemplateUsersResponse)
  users: PaginatedTemplateUsersResponse
}