import { z } from 'zod'

export const BlogSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(255),
  slug: z.string().min(3).max(255),
  content: z.string().min(10),
  cover_image: z.string().nullable().optional(),
  cover_image_path: z.string().nullable().optional(),
  is_deleted: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
  author_id: z.string().uuid(),
})

export type BlogType = z.infer<typeof BlogSchema>