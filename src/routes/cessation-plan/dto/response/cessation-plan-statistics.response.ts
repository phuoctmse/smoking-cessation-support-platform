import { Field, ObjectType, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class CessationPlanStatisticsResponse {
  @Field(() => Int)
  total_plans: number;

  @Field(() => Int)
  active_plans: number;

  @Field(() => Int)
  planning_plans: number;

  @Field(() => Int)
  paused_plans: number;

  @Field(() => Int)
  completed_plans: number;

  @Field(() => Int)
  cancelled_plans: number;

  @Field(() => Float)
  success_rate: number;
}