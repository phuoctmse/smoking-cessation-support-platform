import { Field, ID, ObjectType } from '@nestjs/graphql';
import { QuizQuestion } from '../../quiz-question/entities/quiz-question.entity';

@ObjectType()
export class ProfileQuiz {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  is_active: boolean;

  @Field(() => [QuizQuestion], { nullable: true })
  questions?: QuizQuestion[];

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
} 