import { Field, InputType } from '@nestjs/graphql'
import { IsOptional, IsString, IsEnum } from 'class-validator'
import { CessationPlanStatus } from '@prisma/client'

@InputType()
export class TemplateUsageFiltersInput {
  @Field(() => String, { nullable: true, description: 'Filter by plan status' })
  @IsOptional()
  @IsEnum(CessationPlanStatus)
  status?: CessationPlanStatus

  @Field(() => String, { nullable: true, description: 'Search by user name' })
  @IsOptional()
  @IsString()
  search?: string
}