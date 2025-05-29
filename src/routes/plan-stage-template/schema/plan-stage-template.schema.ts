import { z } from 'zod';

export const PlanStageTemplateSchema = z.object({
  id: z.string().uuid(),
  template_id: z.string().uuid(),
  stage_order: z.number().int().min(1),
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  duration_days: z.number().int().min(1),
  recommended_actions: z.string().optional(),
  is_active: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type PlanStageTemplateType = z.infer<typeof PlanStageTemplateSchema>;