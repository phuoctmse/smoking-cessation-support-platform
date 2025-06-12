import { z } from 'zod';

export const UpdateFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  content: z.string().min(1).max(2000).optional(),
});

export type UpdateFeedbackType = z.infer<typeof UpdateFeedbackSchema>;