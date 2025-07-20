import { z } from "zod";

export const MembershipPackageSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3).max(100),
    description: z.array(z.string().min(3).max(1000)).min(1).max(10),
    price: z.number().min(10000).max(1000000),
    duration_days: z.number().min(1).max(365),
    is_active: z.boolean().default(true),
    created_at: z.date(),
    updated_at: z.date(),
})

export type MembershipPackageType = z.infer<typeof MembershipPackageSchema>