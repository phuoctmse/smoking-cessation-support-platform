import { z } from 'zod'

export const BlogSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(255),
  slug: z.string().min(3).max(255),
  content: z.string().min(10),
  cover_image: z.string().nullable().optional(),
  is_deleted: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
  author_id: z.string().uuid(),
})

export const CreateBlogSchema = BlogSchema.pick({
  title: true,
  content: true,
  cover_image: true,
})

export const UpdateBlogSchema = CreateBlogSchema.partial().extend({
  id: z.string().uuid(),
})

export const BlogQueryParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
  search: z.string().optional(),
  orderBy: z.enum(['created_at', 'updated_at', 'title']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type BlogType = z.infer<typeof BlogSchema>
export type CreateBlogType = z.infer<typeof CreateBlogSchema>
export type UpdateBlogType = z.infer<typeof UpdateBlogSchema>
export type BlogQueryParamsType = z.infer<typeof BlogQueryParamsSchema>
