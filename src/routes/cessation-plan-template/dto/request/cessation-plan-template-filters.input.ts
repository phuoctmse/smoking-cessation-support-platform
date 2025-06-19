import { Field, ID, InputType } from '@nestjs/graphql'
import { DifficultyLevel } from '@prisma/client'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'

@InputType()
export class CessationPlanTemplateFiltersInput {
  @Field(() => ID, { nullable: true, description: 'Filter by coach ID' })
  @IsOptional()
  @IsUUID()
  coachId?: string;

  @Field(() => String, { nullable: true, description: 'Filter by difficulty level (EASY, MEDIUM, HARD)' })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficultyLevel?: DifficultyLevel;
}