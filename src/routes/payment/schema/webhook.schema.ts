import { TransferType } from "src/shared/constants/payment.constant";
import { z } from "zod";

export const webhookSchema = z.object({
    id: z.number(),
    gateway: z.string(),
    transactionDate: z.string(),
    accountNumber: z.string().nullable(),
    code: z.string().nullable(), 
    content: z.string().nullable(), 
    transferType: z.nativeEnum(TransferType), 
    transferAmount: z.number(), 
    accumulated: z.number(), 
    subAccount: z.string().nullable(),
    referenceCode: z.string().nullable(), 
    description: z.string(), 
});

export type WebhookType = z.infer<typeof webhookSchema>;
