import { Body, Controller, Headers, Post } from '@nestjs/common';
import { WebhookPaymentBodyDTO } from './dto/request/webhook.request';
import { TransactionService } from './transaction.service';

@Controller('webhook')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) { }

    @Post('payment')
    async handlePaymentWebhook(@Body() body: WebhookPaymentBodyDTO) {
        return this.transactionService.handlePaymentWebhook(body);
    }
}
