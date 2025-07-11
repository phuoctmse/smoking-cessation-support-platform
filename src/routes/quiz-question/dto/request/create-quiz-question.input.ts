import { Field, InputType, Int } from '@nestjs/graphql';
import { QuestionType } from '@prisma/client';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { GraphQLJSON } from 'graphql-type-json';

@InputType()
export class CreateQuizQuestionInput {
  @Field(() => String)
  quiz_id: string;

  @Field(() => String)
  question_text: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => QuestionType)
  question_type: QuestionType;

  @Field(() => [String], { nullable: true })
  options?: string[];

  @Field(() => Int)
  order: number;

  @Field(() => GraphQLJSON)
  validation_rule: any;

  @Field(() => Boolean, { defaultValue: true })
  is_required?: boolean;
}