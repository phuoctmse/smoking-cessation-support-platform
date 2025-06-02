import { z } from 'zod';
import { CessationPlanStatus } from '@prisma/client';

export const UpdateCessationPlanSchema = z.object({
    id: z.string().uuid('Invalid cessation plan ID'),
    template_id: z.string()
        .uuid('Invalid template ID')
        .optional(),
    reason: z.string()
        .min(1, 'Reason is required')
        .max(500, 'Reason must be less than 500 characters')
        .trim()
        .optional(),
    start_date: z.coerce.date().optional(),
    target_date: z.coerce.date().optional(),
    status: z.nativeEnum(CessationPlanStatus).optional(),
    is_custom: z.boolean().optional(),
}).refine(data => {
    if (data.start_date && data.target_date) {
        return data.target_date > data.start_date;
    }
    return true;
}, {
    message: 'Target date must be after start date',
    path: ['target_date'],
});

export type UpdateCessationPlanType = z.infer<typeof UpdateCessationPlanSchema>;