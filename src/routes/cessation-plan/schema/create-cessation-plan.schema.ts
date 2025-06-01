import { z } from 'zod';

export const CreateCessationPlanSchema = z.object({
    template_id: z.string()
        .uuid('Invalid template ID')
        .optional(),
    reason: z.string()
        .min(1, 'Reason is required')
        .max(500, 'Reason must be less than 500 characters')
        .trim(),
    start_date: z.coerce.date(),
    target_date: z.coerce.date(),
    is_custom: z.boolean().default(false),
}).refine(data => data.target_date > data.start_date, {
    message: 'Target date must be after start date',
    path: ['target_date'],
});

export type CreateCessationPlanType = z.infer<typeof CreateCessationPlanSchema>;