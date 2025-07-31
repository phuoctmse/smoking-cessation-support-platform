import { Field, ID, Int, ObjectType } from '@nestjs/graphql'
import { PlanStageTemplateType } from '../schema/plan-stage-template.schema'

@ObjectType()
export class PlanStageTemplate implements PlanStageTemplateType {
  @Field(() => ID)
  id: string

  @Field(() => String)
  template_id: string

  @Field(() => Int)
  stage_order: number

  @Field(() => String)
  title: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => Int)
  duration_days: number

  @Field(() => String, { nullable: true })
  recommended_actions?: string

  @Field(() => Int, {
    nullable: true,
    description: 'Maximum number of cigarettes allowed per day in this stage'
  })
  max_cigarettes_per_day?: number

  @Field(() => Boolean)
  is_active: boolean

  @Field(() => Date)
  created_at: Date

  @Field(() => Date)
  updated_at: Date
}