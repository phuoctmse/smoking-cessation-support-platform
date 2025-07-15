import { Field, ID, InputType } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod';
import { QuizAttemptSchema } from 'src/routes/quiz-attempt/quiz-attempt.schema';
import { z } from 'zod';

@InputType()
export class StartQuizInput extends createZodDto(QuizAttemptSchema.pick({ quiz_id: true })) {
  @Field(() => String)
  quiz_id: string;
}
