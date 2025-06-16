import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

@InputType()
export class UpdatePostCommentInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  content: string;
}