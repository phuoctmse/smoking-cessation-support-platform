import { WebhookPaymentBodyType } from "../../webhook.model";

export class WebhookResponseDto {
    success: boolean;
    message?: string;
    data?: WebhookPaymentBodyType;
}