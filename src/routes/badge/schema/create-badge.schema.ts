import { z } from 'zod'

export const createBadgeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon_url: z.string().url().optional(),
  badge_type_id: z.string().uuid(),
  requirements: z.string().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export type CreateBadgeType = z.infer<typeof createBadgeSchema>;