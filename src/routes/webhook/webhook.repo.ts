import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";
import { WebhookPaymentBodyDTO } from "./dto/request/webhook.request";
import { TransferType } from "src/shared/constants/payment.constant";

@Injectable()
export class WebhookRepo {
    constructor(private readonly prisma: PrismaService) { }

    async handlePaymentWebhook(body: WebhookPaymentBodyDTO) {
        const { id, gateway, transactionDate, accountNumber, code, content, transferType, transferAmount, accumulated, subAccount, referenceCode, description } = body;

        const paymentTransaction = await this.prisma.paymentTransaction.create({
            data: {
                id: id.toString(),
                gateway,
                transactionDate,
                sepay_id: id.toString(),
                accountNumber,
                code,
                transactionContent: content,
                amountIn: transferType === TransferType.IN ? transferAmount : 0,
                amountOut: transferType === TransferType.OUT ? transferAmount : 0,
                accumulated,
                subAccount,
                referenceNumber: referenceCode,
                body: description,
            },
        });
    }
}