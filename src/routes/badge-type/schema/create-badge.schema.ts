import { z } from 'zod';

export const createBadgeTypeSchema = z.object({
  name: z.string().min(1).max(50),
});

export type CreateBadgeTypeType = z.infer<typeof createBadgeTypeSchema>;