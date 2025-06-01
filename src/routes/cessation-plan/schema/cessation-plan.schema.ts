import { z } from 'zod';
import { CessationPlanStatus } from '@prisma/client';

export const CessationPlanSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    template_id: z.string().uuid().optional(),
    reason: z.string().min(1).max(500),
    start_date: z.date(),
    target_date: z.date(),
    status: z.nativeEnum(CessationPlanStatus),
    is_custom: z.boolean(),
    created_at: z.date(),
    updated_at: z.date(),
});

export type CessationPlanType = z.infer<typeof CessationPlanSchema>;