import { Field, InputType } from '@nestjs/graphql';
import { CessationPlanStatus } from '@prisma/client';

@InputType()
export class CessationPlanFiltersInput {
  @Field(() => String, { nullable: true })
  user_id?: string;

  @Field(() => CessationPlanStatus, { nullable: true })
  status?: CessationPlanStatus;

  @Field(() => String, { nullable: true })
  template_id?: string;

  @Field(() => Date, { nullable: true })
  start_date?: Date;

  @Field(() => Date, { nullable: true })
  target_date?: Date;

  @Field(() => Boolean, { nullable: true })
  is_custom?: boolean;
}