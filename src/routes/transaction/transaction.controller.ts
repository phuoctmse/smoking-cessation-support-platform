import { Body, Controller, Headers, Post } from '@nestjs/common';
import { WebhookPaymentBodyDTO } from './dto/request/webhook.request';
import { TransactionService } from './transaction.service';

@Controller('webhook')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) { }

    @Post('payment')
    async handlePaymentWebhook(@Body() body: WebhookPaymentBodyDTO) {
        try {
            const result = await this.transactionService.handlePaymentWebhook(body);
            return {
                success: true,
                message: 'Webhook processed successfully',
                data: result
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to process webhook',
                error: error.stack
            };
        }
    }
}
