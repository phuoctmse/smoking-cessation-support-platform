import { Field, ID, InputType, Int } from '@nestjs/graphql'
import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator'

@InputType()
export class FeedbackFiltersInput {
  @Field(() => ID, { nullable: true, description: 'Filter by User ID (Admin/Coach only)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @Field(() => ID, { nullable: true, description: 'Filter by Cessation Plan Template ID' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @Field(() => Int, { nullable: true, description: 'Filter by minimum rating' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;

  @Field(() => Int, { nullable: true, description: 'Filter by maximum rating' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  maxRating?: number;
}