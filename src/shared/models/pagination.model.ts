import { z } from 'zod';
import { DEFAULT_LIMIT, DEFAULT_PAGE, DEFAULT_SORT_ORDER, MAX_LIMIT, SortOrder } from '../constants/pagination.constant';

export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().optional(),
  orderBy: z.string().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER as SortOrder),
});

export type PaginationParamsType = z.infer<typeof PaginationParamsSchema>;

export interface PaginatedResponseType<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}