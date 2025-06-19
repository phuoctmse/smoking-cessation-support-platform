import { BadRequestException, Injectable } from '@nestjs/common';
import { TransactionRepo } from './transaction.repo';
import { WebhookPaymentBodyDTO } from './dto/request/webhook.request';

@Injectable()
export class TransactionService {

    constructor(private readonly transactionRepo: TransactionRepo) { }

    async handlePaymentWebhook(body: WebhookPaymentBodyDTO) {
        const transaction = await this.transactionRepo.createTransaction(body);

        if (!transaction) {
            throw new BadRequestException('Transaction failed');
        }

        return {
            success: true,
            message: 'Webhook processed successfully',
        };
    }

}
