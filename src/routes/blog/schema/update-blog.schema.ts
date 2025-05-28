import { z } from 'zod'
import { CreateBlogSchema } from './create-blog.schema'

export const UpdateBlogSchema = CreateBlogSchema.partial().extend({
  id: z.string().uuid('Invalid blog ID'),
});

export type UpdateBlogType = z.infer<typeof UpdateBlogSchema>;