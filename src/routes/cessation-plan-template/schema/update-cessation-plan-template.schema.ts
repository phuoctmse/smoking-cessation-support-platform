import { CreateCessationPlanTemplateSchema } from './create-cessation-plan-template.schema'
import { z } from 'zod'

export const UpdateCessationPlanTemplateSchema = CreateCessationPlanTemplateSchema.partial().extend({
  id: z.string().uuid('Invalid template ID'),
})

export type UpdateCessationPlanTemplateType = z.infer<typeof UpdateCessationPlanTemplateSchema>