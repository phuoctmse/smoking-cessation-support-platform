import { Field, ID, InputType } from '@nestjs/graphql'
import { IsDate, IsOptional, IsUUID } from 'class-validator'

@InputType()
export class ProgressRecordFiltersInput {
  @Field(() => ID, { nullable: true, description: 'Filter by Cessation Plan ID' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @Field(() => Date, { nullable: true, description: 'Filter records from this date' })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @Field(() => Date, { nullable: true, description: 'Filter records up to this date' })
  @IsOptional()
  @IsDate()
  endDate?: Date;
}