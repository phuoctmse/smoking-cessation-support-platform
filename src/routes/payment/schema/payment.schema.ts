import { PaymentStatus } from "@prisma/client";
import { z } from "zod";

export const paymentSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    subscription_id: z.string().uuid(),
    status: z.nativeEnum(PaymentStatus),
    payment_transaction_id: z.string().uuid().optional(),
});

export type PaymentType = z.infer<typeof paymentSchema>;