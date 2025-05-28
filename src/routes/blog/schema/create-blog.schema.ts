import { z } from 'zod';

export const CreateBlogSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title must be less than 255 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  cover_image: z.string().nullable().optional(),
  cover_image_path: z.string().nullable().optional(),
});

export type CreateBlogType = z.infer<typeof CreateBlogSchema>;