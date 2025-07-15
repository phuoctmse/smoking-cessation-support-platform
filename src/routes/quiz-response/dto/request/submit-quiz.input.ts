import { Field, ID, InputType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class QuizResponseItem {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  question_id: string;

  @Field(() => GraphQLJSON)
  answer: any;
}

@InputType()
export class SubmitQuizInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  attempt_id: string;

  @Field(() => [QuizResponseItem])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizResponseItem)
  responses: QuizResponseItem[];
}
