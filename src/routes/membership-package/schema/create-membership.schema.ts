import { z } from "zod";

export const CreateMembershipPackageSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
    description: z.string().min(3, 'Description must be at least 3 characters').max(1000, 'Description must be less than 1000 characters'),
    price: z.number().min(10000, 'Price must be at least 10000').max(1000000, 'Price must be less than 1000000'),
    duration_days: z.number().min(1, 'Duration must be at least 1 day').max(365, 'Duration must be less than 365 days'),
})

export type CreateMembershipPackageType = z.infer<typeof CreateMembershipPackageSchema>