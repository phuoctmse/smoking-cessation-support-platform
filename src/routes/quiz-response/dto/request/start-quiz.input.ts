import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class StartQuizInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  quiz_id: string;

}
