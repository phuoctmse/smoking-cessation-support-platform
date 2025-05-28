import { Field, InputType } from '@nestjs/graphql'
import { createZodDto } from 'nestjs-zod'
import { CreateCessationPlanTemplateSchema } from '../../schema/create-cessation-plan-template.schema'
import { DifficultyLevel } from '@prisma/client'

@InputType()
export class CreateCessationPlanTemplateInput extends createZodDto(CreateCessationPlanTemplateSchema) {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { defaultValue: 'MEDIUM' })
  difficulty_level: DifficultyLevel;

  @Field(() => Number)
  estimated_duration_days: number;
}