import { z } from "zod";

export const CreateMembershipPackageSchema = z.object({
    name: z.string(),
    description: z.string(),
    price: z.number(),
    duration_days: z.number(),
})

export type CreateMembershipPackageType = z.infer<typeof CreateMembershipPackageSchema>