import { z } from 'zod'

export const updateBadgeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  icon_url: z.string().url().optional(),
  badge_type_id: z.string().uuid().optional(),
  requirements: z.string().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type UpdateBadgeType = z.infer<typeof updateBadgeSchema>;