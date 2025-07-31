import { Field, InputType, Int } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod';
import { CreatePlanStageTemplateSchema } from '../../schema/create-plan-stage-template.schema'

@InputType()
export class CreatePlanStageTemplateInput extends createZodDto(CreatePlanStageTemplateSchema) {
  @Field(() => String)
  template_id: string;

  @Field(() => Int)
  stage_order: number;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Int)
  duration_days: number;

  @Field(() => String, { nullable: true })
  recommended_actions?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Maximum number of cigarettes allowed per day in this stage'
  })
  max_cigarettes_per_day?: number;
}