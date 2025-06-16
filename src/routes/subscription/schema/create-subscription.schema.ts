import { z } from "zod";

export const CreateSubscriptionSchema = z.object({
    user_id: z.string().uuid(),
    package_id: z.string().uuid(),
}).strict()

export type CreateSubscriptionSchemaType = z.infer<typeof CreateSubscriptionSchema>
