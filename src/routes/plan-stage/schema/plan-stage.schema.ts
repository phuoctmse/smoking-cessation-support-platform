import { z } from 'zod';
import { PlanStageStatus } from '@prisma/client';

export const PlanStageSchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid(),
  template_stage_id: z.string().uuid().optional(),
  stage_order: z.number().int().min(1),
  title: z.string().min(1).max(100),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  description: z.string().optional(),
  actions: z.string().optional(),
  status: z.nativeEnum(PlanStageStatus),
  created_at: z.date(),
  updated_at: z.date(),
});

export type PlanStageType = z.infer<typeof PlanStageSchema>;