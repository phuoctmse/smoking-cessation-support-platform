import { SubscriptionStatus } from "src/shared/constants/subscription.constant";
import { z } from "zod";

export const SubscriptionSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    package_id: z.string().uuid(),
    status: z.nativeEnum(SubscriptionStatus).default(SubscriptionStatus.Inactive),
    start_date: z.date().refine(date => date.getTime() < Date.now(), {
        message: 'Start date must be in the past'
    }),
    end_date: z.date().refine(date => date.getTime() > Date.now(), {
        message: 'End date must be in the future'
    }),
    created_at: z.date(),
    updated_at: z.date(),
}).strict().superRefine((data, ctx) => {
    if (data.start_date > data.end_date) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Start date must be before end date',
        })
    }
})

export type SubscriptionSchemaType = z.infer<typeof SubscriptionSchema>