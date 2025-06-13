import { z } from 'zod';

export const updateBadgeTypeSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateBadgeTypeType = z.infer<typeof updateBadgeTypeSchema>;