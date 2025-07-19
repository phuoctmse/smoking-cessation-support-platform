import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';

@InputType()
export class HealthScoreCriteriaFiltersInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  coach_id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}