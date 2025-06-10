import { InputType, Int, Field, ID } from '@nestjs/graphql'
import { createZodDto } from 'nestjs-zod'
import { CreateProgressRecordSchema } from '../../schema/create-progress-record.schema'

@InputType()
export class CreateProgressRecordInput extends createZodDto(CreateProgressRecordSchema) {
  @Field(() => ID)
  plan_id: string;

  @Field(() => Date)
  record_date: Date;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  cigarettes_smoked?: number;

  @Field(() => Int, { nullable: true })
  health_score?: number;

  @Field(() => String, { nullable: true })
  notes?: string;
}