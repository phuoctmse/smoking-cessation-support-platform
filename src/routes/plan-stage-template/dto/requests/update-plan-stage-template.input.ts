import { Field, InputType, Int } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod';
import { UpdatePlanStageTemplateSchema } from '../../schema/update-plan-stage-template.schema'

@InputType()
export class UpdatePlanStageTemplateInput extends createZodDto(UpdatePlanStageTemplateSchema) {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  template_id?: string;

  @Field(() => Int, { nullable: true })
  stage_order?: number;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Int, { nullable: true })
  duration_days?: number;

  @Field(() => String, { nullable: true })
  recommended_actions?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Maximum number of cigarettes allowed per day in this stage'
  })
  max_cigarettes_per_day?: number;
}