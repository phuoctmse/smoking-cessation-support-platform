import { Field, InputType, Int } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod';
import { CreatePlanStageSchema } from '../../schema/create-plan-stage.schema';

@InputType()
export class CreatePlanStageInput extends createZodDto(CreatePlanStageSchema) {
  @Field(() => String)
  plan_id: string;

  @Field(() => String, { nullable: true })
  template_stage_id?: string;

  @Field(() => Int)
  stage_order: number;

  @Field(() => String)
  title: string;

  @Field(() => Date, { nullable: true })
  start_date?: Date;

  @Field(() => Date, { nullable: true })
  end_date?: Date;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  actions?: string;
}