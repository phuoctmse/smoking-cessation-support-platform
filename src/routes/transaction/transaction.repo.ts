import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";
import { WebhookPaymentBodyDTO } from "./dto/request/webhook.request";
import { PaymentStatus, TransferType } from "src/shared/constants/payment.constant";
import { parse } from 'date-fns'
import envConfig from "src/shared/config/config";
import { isUUID } from "class-validator";
import { SubscriptionStatus } from "src/shared/constants/subscription.constant";

@Injectable()
export class TransactionRepo {
    constructor(private readonly prisma: PrismaService) { }

    async createTransaction(body: WebhookPaymentBodyDTO) {
        //Save transaction to database
        let amountIn = 0
        let amountOut = 0
        if (body.transferType === TransferType.IN) {
            amountIn = body.transferAmount
        } else if (body.transferType === TransferType.OUT) {
            amountOut = body.transferAmount
        }

        const paymentTransaction = await this.prisma.paymentTransaction.findUnique({
            where: {
                sepay_id: body.id.toString(),
            },
        });

        if (paymentTransaction) {
            throw new BadRequestException('Transaction already exists');
        }

        const transactionData = {
            sepay_id: body.id.toString(),
            gateway: body.gateway,
            transactionDate: new Date(body.transactionDate),
            accountNumber: body.accountNumber,
            subAccount: body.subAccount,
            amountIn,
            amountOut,
            accumulated: body.accumulated || 0,
            code: body.code,
            transactionContent: body.content,
            referenceNumber: body.referenceCode,
            body: body.description
        };

        const savedTransaction = await this.prisma.$transaction(async (tx) => {
            const paymentTransaction = await tx.paymentTransaction.create({
                data: transactionData
            });

            //check content and total amount is match
            const payment_id = body.content?.split(envConfig.PREFIX_PAYMENT_CODE)[1]
            if (!isUUID(payment_id)) {
                throw new BadRequestException('Cannot get payment id from content')
            }

            const payment = await tx.payment.findUnique({
                where: {
                    id: payment_id
                }, include: {
                    subscription: {
                        include: {
                            package: true
                        }
                    }
                }
            })

            if (!payment) {
                throw new BadRequestException('Payment not found')
            }

            const packageAmount = payment.subscription.package.price
            if (amountIn !== packageAmount) {
                throw new BadRequestException('Amount is not match with package price')
            }

           
            await tx.payment.update({
                where: {
                    id: payment_id
                },
                data: {
                    status: PaymentStatus.SUCCESS,
                    payment_transaction_id: paymentTransaction.id
                }
            })

            await tx.userSubscription.update({
                where: {
                    id: payment.subscription_id
                },
                data: {
                    status: SubscriptionStatus.Active
                }
            })

            return paymentTransaction;
        })

        return savedTransaction;
    }

}
