import { Field, ObjectType, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class PlanStageStatisticsResponse {
  @Field(() => Int)
  total_stages: number;

  @Field(() => Int)
  pending_stages: number;

  @Field(() => Int)
  active_stages: number;

  @Field(() => Int)
  completed_stages: number;

  @Field(() => Int)
  skipped_stages: number;

  @Field(() => Float)
  completion_rate: number;
}