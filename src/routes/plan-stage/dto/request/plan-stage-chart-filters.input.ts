import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class PlanStageChartFiltersInput {
  @Field(() => String, { nullable: true, description: 'Filter data from this date (YYYY-MM-DD)' })
  from_date?: string;

  @Field(() => String, { nullable: true, description: 'Filter data to this date (YYYY-MM-DD)' })
  to_date?: string;

  @Field(() => [String], { nullable: true, description: 'Include only specific stage IDs' })
  stage_ids?: string[];
}