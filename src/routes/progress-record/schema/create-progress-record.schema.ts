import { z } from 'zod';

export const CreateProgressRecordSchema = z.object({
  plan_id: z.string().uuid('Invalid plan ID'),
  record_date: z.coerce.date({
    errorMap: () => ({ message: 'Invalid record date' }),
  }),
  cigarettes_smoked: z.number().int('Cigarettes smoked must be an integer').min(0, 'Cannot be negative').default(0),
  health_score: z.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional().nullable(),
});

export type CreateProgressRecordType = z.infer<typeof CreateProgressRecordSchema>;