import { Field, ID, ObjectType, Int } from '@nestjs/graphql';
import { CessationPlanTemplate } from '../../cessation-plan-template/entities/cessation-plan-template.entity';
import {PlanStageTemplateType} from "../schema/plan-stage-template.schema";

@ObjectType()
export class PlanStageTemplate implements PlanStageTemplateType {
  @Field(() => ID)
  id: string;

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

  @Field(() => Boolean)
  is_active: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;

  @Field(() => CessationPlanTemplate)
  template: CessationPlanTemplate;
}