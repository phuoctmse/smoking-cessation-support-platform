import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql'
import { CessationPlanTemplateType } from '../schema/cessation-plan-template.schema'
import { DifficultyLevel } from '@prisma/client'
import { User } from '../../user/entities/user.entity'
import { PlanStageTemplate } from '../../plan-stage-template/entities/plan-stage-template.entity'

@ObjectType()
export class CessationPlanTemplate implements CessationPlanTemplateType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String)
  difficulty_level: DifficultyLevel;

  @Field(() => Int)
  estimated_duration_days: number;

  @Field(() => Float, { nullable: true })
  average_rating?: number;

  @Field(() => Int)
  total_reviews: number;

  @Field(() => Float, { nullable: true })
  success_rate?: number;

  @Field(() => Boolean)
  is_active: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;

  @Field(() => String, { description: 'ID of the coach who created this template' })
  coach_id: string;

  @Field(() => User, { description: 'The coach who created this template' })
  coach: User;

  @Field(() => [PlanStageTemplate])
  stages?: PlanStageTemplate[];
}