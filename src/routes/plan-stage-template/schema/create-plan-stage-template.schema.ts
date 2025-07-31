import { z } from 'zod';

export const CreatePlanStageTemplateSchema = z.object({
  template_id: z.string()
      .uuid('Invalid template ID'),
  stage_order: z.number()
      .int('Stage order must be an integer')
      .min(1, 'Stage order must be at least 1')
      .max(100, 'Stage order cannot exceed 100'),
  title: z.string()
      .min(1, 'Title is required')
      .max(100, 'Title must be less than 100 characters')
      .trim(),
  description: z.string()
      .max(2000, 'Description must be less than 2000 characters')
      .optional(),
  duration_days: z.number()
      .int('Duration must be an integer')
      .min(1, 'Duration must be at least 1 day')
      .max(365, 'Duration cannot exceed 365 days'),
  recommended_actions: z.string()
      .max(2000, 'Recommended actions must be less than 2000 characters')
      .optional(),
  max_cigarettes_per_day: z.number()
    .int('Max cigarettes must be an integer')
    .min(0, 'Max cigarettes cannot be negative')
    .max(100, 'Max cigarettes per day cannot exceed 100')
    .optional(),
});

export type CreatePlanStageTemplateType = z.infer<typeof CreatePlanStageTemplateSchema>;