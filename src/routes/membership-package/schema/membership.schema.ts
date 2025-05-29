import { z } from "zod";

export const MembershipPackageSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    price: z.number(),
    duration_days: z.number(),
    created_at: z.date(),
    updated_at: z.date(),
})

export type MembershipPackageType = z.infer<typeof MembershipPackageSchema>