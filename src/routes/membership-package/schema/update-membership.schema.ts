import { z } from "zod";
import { CreateMembershipPackageSchema } from "./create-membership.schema";

export const UpdateMembershipPackageSchema = CreateMembershipPackageSchema.partial()
    .extend({
        id: z.string().uuid('Invalid membership package ID')
    });

export type UpdateMembershipPackageType = z.infer<typeof UpdateMembershipPackageSchema>;