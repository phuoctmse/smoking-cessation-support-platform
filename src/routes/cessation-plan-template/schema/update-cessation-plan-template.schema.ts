import { z } from 'zod'
import { DifficultyLevel } from '@prisma/client'

export const UpdateCessationPlanTemplateSchema = z.object({
  id: z.string().uuid('Invalid cessation plan template ID'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  difficulty_level: z.nativeEnum(DifficultyLevel).optional(),
  estimated_duration_days: z.number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 day')
    .max(365, 'Duration must be less than 365 days')
    .optional(),
  success_rate: z.number()
    .min(0, 'Success rate cannot be negative')
    .max(100, 'Success rate cannot exceed 100%')
    .optional(),
});

export type UpdateCessationPlanTemplateType = z.infer<typeof UpdateCessationPlanTemplateSchema>;