import { ObjectType, Field, Int, ID } from '@nestjs/graphql'
import { CessationPlan } from '../../cessation-plan/entities/cessation-plan.entity'
import { ProgressRecordType } from '../schema/progress-record.schema'

@ObjectType()
export class ProgressRecord implements ProgressRecordType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  plan_id: string;

  @Field(() => Int)
  cigarettes_smoked: number;

  @Field(() => Int, { nullable: true })
  health_score?: number;

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field(() => Date)
  record_date: Date;

  @Field(() => Boolean)
  is_deleted: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;

  @Field(() => CessationPlan, { nullable: true })
  plan?: CessationPlan;

  @Field(() => Int, {
    nullable: true,
  })
  money_saved_this_day?: number;
}
