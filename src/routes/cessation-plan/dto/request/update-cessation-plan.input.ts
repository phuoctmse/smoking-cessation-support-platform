import { Field, InputType } from '@nestjs/graphql';
import { CessationPlanStatus } from '@prisma/client';
import { UpdateCessationPlanSchema } from '../../schema/update-cessation-plan.schema'
import { createZodDto } from 'nestjs-zod'

@InputType()
export class UpdateCessationPlanInput extends createZodDto(UpdateCessationPlanSchema) {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  template_id?: string;

  @Field(() => String, { nullable: true })
  reason?: string;

  @Field(() => Date, { nullable: true })
  start_date?: Date;

  @Field(() => Date, { nullable: true })
  target_date?: Date;

  @Field(() => CessationPlanStatus, { nullable: true })
  status?: CessationPlanStatus;

  @Field(() => Boolean, { nullable: true })
  is_custom?: boolean;
}