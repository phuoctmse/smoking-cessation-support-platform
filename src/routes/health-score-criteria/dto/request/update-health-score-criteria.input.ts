import { InputType, Field, ID } from '@nestjs/graphql'
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

@InputType()
export class UpdateHealthScoreCriteriaInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

export type UpdateHealthScoreCriteriaType = UpdateHealthScoreCriteriaInput;
