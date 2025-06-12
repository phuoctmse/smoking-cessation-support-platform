import { InputType, Int, Field, ID } from '@nestjs/graphql'
import { CreateFeedbackSchema } from '../../schema/create-feedback.schema'
import { createZodDto } from 'nestjs-zod'

@InputType()
export class CreateFeedbackInput extends createZodDto(CreateFeedbackSchema) {
  @Field(() => ID)
  template_id: string;

  @Field(() => Int)
  rating: number;

  @Field(() => String)
  content: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false, description: "Set to true to submit feedback anonymously." })
  is_anonymous?: boolean;
}
