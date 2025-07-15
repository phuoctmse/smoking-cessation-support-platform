import { Field, ObjectType } from '@nestjs/graphql';
import { QuizQuestion } from '../../entities/quiz-question.entity';

@ObjectType()
export class QuizQuestionResponse {
  @Field(() => String)
  message: string;

  @Field(() => QuizQuestion)
  data: QuizQuestion;
}

@ObjectType()
export class DeleteQuizQuestionResponse {
  @Field(() => String)
  message: string;

  @Field(() => Boolean)
  success: boolean;
} 