import { z } from 'zod';

export const CreatePlanStageSchema = z.object({
  plan_id: z.string()
    .uuid('Invalid plan ID'),
  template_stage_id: z.string()
    .uuid('Invalid template stage ID')
    .optional(),
  stage_order: z.number()
    .int('Stage order must be an integer')
    .min(1, 'Stage order must be at least 1'),
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  actions: z.string()
    .max(2000, 'Actions must be less than 2000 characters')
    .optional(),
}).refine(data => {
  if (data.start_date && data.end_date) {
    return data.end_date > data.start_date;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

export type CreatePlanStageType = z.infer<typeof CreatePlanStageSchema>;