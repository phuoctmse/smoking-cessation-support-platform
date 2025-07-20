import { z } from 'zod';

export const FeedbackSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  template_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(1).max(2000),
  is_anonymous: z.boolean().default(false),
  is_deleted: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
});

export type FeedbackType = z.infer<typeof FeedbackSchema>;