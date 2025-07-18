import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { QuestionType } from 'src/shared/constants/question-type.constant';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { GraphQLJSON } from 'graphql-type-json';
import { CreateQuizQuestionInput } from './create-quiz-question.input';

@InputType()
export class UpdateQuizQuestionInput extends PartialType(CreateQuizQuestionInput) {
  @Field(() => ID)
  id: string;
} 