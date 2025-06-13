import { Body, Controller, Post } from '@nestjs/common';
import { WebhookPaymentBodyDTO } from './dto/request/webhook.request';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
    constructor(private readonly webhookService: WebhookService) {}

    @Post('payment')
    async handlePaymentWebhook(@Body() body: WebhookPaymentBodyDTO) {
        return this.webhookService.handlePaymentWebhook(body);
    }
}
