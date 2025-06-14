import { z } from "zod";

export const CreateSubscriptionSchema = z.object({
    user_id: z.string().uuid(),
    package_id: z.string().uuid(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
}).strict()

export type CreateSubscriptionSchemaType = z.infer<typeof CreateSubscriptionSchema>
