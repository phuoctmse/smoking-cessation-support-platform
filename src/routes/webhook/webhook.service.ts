import { Injectable } from '@nestjs/common';
import { WebhookRepo } from './webhook.repo';
import { WebhookPaymentBodyDTO } from './dto/request/webhook.request';

@Injectable()
export class WebhookService {
    constructor(private readonly webhookRepo: WebhookRepo) {}

    async handlePaymentWebhook(body: WebhookPaymentBodyDTO) {
        return this.webhookRepo.handlePaymentWebhook(body);
    }
}
