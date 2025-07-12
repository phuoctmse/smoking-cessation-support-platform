import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

@InputType()
export class CreateHealthScoreCriteriaInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description: string;
}

export type CreateHealthScoreCriteriaType = CreateHealthScoreCriteriaInput;
