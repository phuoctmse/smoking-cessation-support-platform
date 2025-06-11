import { z } from 'zod';
import { CreateProgressRecordSchema } from './create-progress-record.schema'

export const UpdateProgressRecordSchema = CreateProgressRecordSchema.partial().extend({
  id: z.string().uuid('Invalid progress record ID'),
});

export type UpdateProgressRecordType = z.infer<typeof UpdateProgressRecordSchema>;