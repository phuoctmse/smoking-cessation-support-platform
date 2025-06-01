import { Field, ID, ObjectType, Int, Float } from '@nestjs/graphql';
import { CessationPlanStatus } from '@prisma/client';
import { User } from '../../user/entities/user.entity';
import { CessationPlanTemplate } from '../../cessation-plan-template/entities/cessation-plan-template.entity';
import { CessationPlanType } from '../schema/cessation-plan.schema'

@ObjectType()
export class CessationPlan implements CessationPlanType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  user_id: string;

  @Field(() => String, { nullable: true })
  template_id?: string;

  @Field(() => String)
  reason: string;

  @Field(() => Date)
  start_date: Date;

  @Field(() => Date)
  target_date: Date;

  @Field(() => CessationPlanStatus)
  status: CessationPlanStatus;

  @Field(() => Boolean)
  is_custom: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;

  @Field(() => Float)
  completion_percentage: number;

  @Field(() => Int)
  days_since_start: number;

  @Field(() => Int)
  days_to_target: number;

  @Field(() => Boolean)
  is_overdue: boolean;

  @Field(() => User)
  user: User;

  @Field(() => CessationPlanTemplate, { nullable: true })
  template?: CessationPlanTemplate;
}