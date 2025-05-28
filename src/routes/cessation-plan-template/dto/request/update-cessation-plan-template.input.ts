import { Field, InputType } from '@nestjs/graphql'
import { createZodDto } from 'nestjs-zod'
import { UpdateCessationPlanTemplateSchema } from '../../schema/update-cessation-plan-template.schema'
import { DifficultyLevel } from '@prisma/client'

@InputType()
export class UpdateCessationPlanTemplateInput extends createZodDto(UpdateCessationPlanTemplateSchema) {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  difficulty_level?: DifficultyLevel;

  @Field(() => Number, { nullable: true })
  estimated_duration_days?: number;
}