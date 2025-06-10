import { InputType, Field, Int, ID } from '@nestjs/graphql'
import { createZodDto } from 'nestjs-zod'
import { UpdateProgressRecordSchema } from '../../schema/update-progress-record.schema'

@InputType()
export class UpdateProgressRecordInput extends createZodDto(UpdateProgressRecordSchema) {
  @Field(() => ID)
  id: string;

  @Field(() => Date, { nullable: true })
  record_date?: Date;

  @Field(() => Int, { nullable: true })
  cigarettes_smoked?: number;

  @Field(() => Int, { nullable: true })
  health_score?: number;

  @Field(() => String, { nullable: true })
  notes?: string;
}
