
import { PaymentStatus } from "src/shared/constants/payment.constant";
import { z } from "zod";

export const paymentSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    subscription_id: z.string().uuid(),
    status: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
    payment_transaction_id: z.string().uuid().optional(),
    price: z.number().optional(),
});

export type PaymentType = z.infer<typeof paymentSchema>;