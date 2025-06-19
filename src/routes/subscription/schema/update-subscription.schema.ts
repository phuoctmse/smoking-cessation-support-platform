import { SubscriptionStatus } from "src/shared/constants/subscription.constant";
import { z } from "zod";

export const UpdateSubscriptionSchema = z.object({
    id: z.string(),
    status: z.nativeEnum(SubscriptionStatus),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
}).strict()

export type UpdateSubscriptionSchemaType = z.infer<typeof UpdateSubscriptionSchema>
