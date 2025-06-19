import { Field, InputType } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod'
import { CreateCessationPlanSchema } from '../../schema/create-cessation-plan.schema'

@InputType()
export class CreateCessationPlanInput extends createZodDto(CreateCessationPlanSchema) {
  @Field(() => String, { nullable: true })
  template_id?: string;

  @Field(() => String)
  reason: string;

  @Field(() => Date)
  start_date: Date;

  @Field(() => Date)
  target_date: Date;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  is_custom?: boolean;
}