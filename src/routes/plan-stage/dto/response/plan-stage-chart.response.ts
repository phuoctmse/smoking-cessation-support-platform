import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StageChartDataPoint {
  @Field(() => String, { description: 'Date in YYYY-MM-DD format' })
  date: string;

  @Field(() => Int, { description: 'Number of cigarettes smoked on this date' })
  cigarettes_smoked: number;

  @Field(() => Boolean, { description: 'Whether user exceeded stage limit on this date' })
  exceeded_limit: boolean;
}

@ObjectType()
export class PlanStageChartData {
  @Field(() => String)
  stage_id: string;

  @Field(() => String)
  title: string;

  @Field(() => Int, { nullable: true, description: 'Maximum cigarettes allowed per day in this stage' })
  max_cigarettes_per_day?: number;

  @Field(() => String, { nullable: true })
  start_date?: string;

  @Field(() => String, { nullable: true })
  end_date?: string;

  @Field(() => Int, { description: 'Stage order in the plan' })
  stage_order: number;

  @Field(() => String, { description: 'Current status of the stage' })
  status: string;

  @Field(() => [StageChartDataPoint], { description: 'Daily cigarette consumption data' })
  chart_data: StageChartDataPoint[];

  @Field(() => Int, { description: 'Total days in this stage' })
  total_days: number;
}

@ObjectType()
export class PlanStageChartsResponse {
  @Field(() => String)
  plan_id: string;

  @Field(() => String, { nullable: true })
  plan_name?: string;

  @Field(() => [PlanStageChartData])
  stages: PlanStageChartData[];

  @Field(() => Int)
  total_stages: number;
}