import { z } from 'zod';
import { PlanStageStatus } from '@prisma/client';

export const UpdatePlanStageSchema = z.object({
  id: z.string().uuid('Invalid plan stage ID'),
  plan_id: z.string()
    .uuid('Invalid plan ID')
    .optional(),
  template_stage_id: z.string()
    .uuid('Invalid template stage ID')
    .optional(),
  stage_order: z.number()
    .int('Stage order must be an integer')
    .min(1, 'Stage order must be at least 1')
    .optional(),
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim()
    .optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  actions: z.string()
    .max(2000, 'Actions must be less than 2000 characters')
    .optional(),
  max_cigarettes_per_day: z.number()
    .int('Max cigarettes must be an integer')
    .min(0, 'Max cigarettes cannot be negative')
    .max(100, 'Max cigarettes per day cannot exceed 100')
    .optional(),
  status: z.nativeEnum(PlanStageStatus).optional(),
  completion_notes: z.string()
    .max(1000, 'Completion notes must be less than 1000 characters')
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

export type UpdatePlanStageType = z.infer<typeof UpdatePlanStageSchema>;