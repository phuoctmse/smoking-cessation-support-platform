import { ObjectType, Field, Float, Int } from '@nestjs/graphql'

@ObjectType()
export class DashboardStats {
  @Field(() => Int)
  totalUsers: number

  @Field(() => Float)
  totalRevenue: number

  @Field(() => Int)
  totalCessationTemplates: number

  @Field(() => Int)
  totalCoaches: number

  @Field(() => Float, { nullable: true })
  averageTemplateRating?: number
}

@ObjectType()
export class RevenueByMonth {
  @Field()
  month: string

  @Field(() => Float)
  revenue: number
}

@ObjectType()
export class DashboardMetrics {
  @Field(() => DashboardStats)
  stats: DashboardStats

  @Field(() => [RevenueByMonth])
  revenueByMonth: RevenueByMonth[]
}
