import { Field, ObjectType } from '@nestjs/graphql';
import { ProfileQuiz } from '../../entities/profile-quiz.entity';

@ObjectType()
export class ProfileQuizResponse {
  @Field(() => String)
  message: string;

  @Field(() => ProfileQuiz)
  data: ProfileQuiz;
}

@ObjectType()
export class DeleteProfileQuizResponse {
  @Field(() => String)
  message: string;

  @Field(() => Boolean)
  success: boolean;
} 