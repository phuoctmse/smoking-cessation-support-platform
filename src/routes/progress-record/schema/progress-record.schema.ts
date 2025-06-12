import { z } from 'zod';

export const ProgressRecordSchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid(),
  cigarettes_smoked: z.number().int().min(0).default(0),
  health_score: z.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  record_date: z.coerce.date(),
  is_deleted: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
});

export type ProgressRecordType = z.infer<typeof ProgressRecordSchema>;