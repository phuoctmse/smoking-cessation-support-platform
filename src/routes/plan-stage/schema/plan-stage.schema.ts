import { z } from 'zod';
import { PlanStageStatus } from '@prisma/client';

export const PlanStageSchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid(),
  template_stage_id: z.string().uuid().optional().nullable(),
  stage_order: z.number().int().min(1).nullable(),
  title: z.string().min(1).max(100),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
  description: z.string().optional().nullable(),
  actions: z.string().optional().nullable(),
  status: z.nativeEnum(PlanStageStatus),
  is_deleted: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type PlanStageType = z.infer<typeof PlanStageSchema>;