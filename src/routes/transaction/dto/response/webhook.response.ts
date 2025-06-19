import { WebhookPaymentBodyType } from "../../transaction.model";

export class WebhookResponseDto {
    success: boolean;
    message?: string;
    data?: WebhookPaymentBodyType;
}