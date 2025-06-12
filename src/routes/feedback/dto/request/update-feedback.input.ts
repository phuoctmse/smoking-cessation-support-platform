import { InputType, Field, Int } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod'
import { UpdateFeedbackSchema } from '../../schema/update-feedback.schema'

@InputType()
export class UpdateFeedbackInput extends createZodDto(UpdateFeedbackSchema) {
  @Field(() => Int, { nullable: true })
  rating?: number;

  @Field(() => String, { nullable: true })
  content?: string;
}