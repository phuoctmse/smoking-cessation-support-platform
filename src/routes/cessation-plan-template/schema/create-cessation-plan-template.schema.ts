import { z } from 'zod'
import { DifficultyLevel } from '@prisma/client'

export const CreateCessationPlanTemplateSchema = z.object({
  name: z.string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .trim(),
  description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
  difficulty_level: z.nativeEnum(DifficultyLevel)
      .default(DifficultyLevel.MEDIUM),
  estimated_duration_days: z.number()
      .int('Duration must be a whole number')
      .min(1, 'Duration must be at least 1 day')
      .max(365, 'Duration must be less than 365 days'),
});

export type CreateCessationPlanTemplateType = z.infer<typeof CreateCessationPlanTemplateSchema>;