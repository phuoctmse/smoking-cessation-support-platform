import { Field, InputType, Int } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod';
import { UpdatePlanStageSchema } from '../../schema/update-plan-stage.schema';
import { PlanStageStatus } from '@prisma/client';

@InputType()
export class UpdatePlanStageInput extends createZodDto(UpdatePlanStageSchema) {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  plan_id?: string;

  @Field(() => String, { nullable: true })
  template_stage_id?: string;

  @Field(() => Int, { nullable: true })
  stage_order?: number;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => Date, { nullable: true })
  start_date?: Date;

  @Field(() => Date, { nullable: true })
  end_date?: Date;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  actions?: string;

  @Field(() => PlanStageStatus, { nullable: true })
  status?: PlanStageStatus;

  @Field(() => String, { nullable: true })
  completion_notes?: string;
}