import { z } from 'zod'
import { DifficultyLevel } from '@prisma/client'

export const CessationPlanTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  difficulty_level: z.nativeEnum(DifficultyLevel),
  estimated_duration_days: z.number().int().min(1).max(365),
  average_rating: z.number().min(0).max(5).optional(),
  total_reviews: z.number().int().min(0),
  success_rate: z.number().min(0).max(100).optional(),
  is_active: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type CessationPlanTemplateType = z.infer<typeof CessationPlanTemplateSchema>;