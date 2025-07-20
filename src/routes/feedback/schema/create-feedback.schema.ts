import { z } from 'zod';

export const CreateFeedbackSchema = z.object({
  template_id: z.string().uuid('Invalid template ID'),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  content: z.string().min(1, 'Feedback content cannot be empty').max(2000, 'Feedback content is too long'),
  is_anonymous: z.boolean().optional().default(false),
});

export type CreateFeedbackType = z.infer<typeof CreateFeedbackSchema>;