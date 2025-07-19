import { Field, ObjectType } from '@nestjs/graphql';
import { QuizResponse } from '../../entities/quiz-response.entity';

@ObjectType()
export class SubmitQuizResponse {
  @Field(() => String)
  message: string;

  @Field(() => String)
  attempt_id: string;

  @Field(() => [QuizResponse])
  responses: QuizResponse[];

  @Field(() => Boolean)
  member_profile_updated: boolean;
}
