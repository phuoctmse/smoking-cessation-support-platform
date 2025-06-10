import { Field, ID, ObjectType, Int } from '@nestjs/graphql';
import { PlanStageStatus } from '@prisma/client';
import { PlanStageType } from '../schema/plan-stage.schema';
import { PlanStageTemplate } from '../../plan-stage-template/entities/plan-stage-template.entity';

@ObjectType()
export class PlanStage implements PlanStageType {
  @Field(() => ID)
  id: string;

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

  @Field(() => PlanStageStatus)
  status: PlanStageStatus;

  @Field(() => Boolean)
  is_deleted: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;

  @Field(() => Int, { defaultValue: 0 })
  days_since_start?: number;

  @Field(() => Int, { defaultValue: 0 })
  days_to_end?: number;

  @Field(() => Boolean, { defaultValue: false })
  is_overdue?: boolean;

  @Field(() => Boolean, { defaultValue: false })
  can_start?: boolean;

  @Field(() => Boolean, { defaultValue: false })
  can_complete?: boolean;

  @Field(() => PlanStageTemplate, { nullable: true })
  template_stage?: PlanStageTemplate;
}
