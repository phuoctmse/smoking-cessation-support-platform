import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";
import { UpdatePaymentInput } from "./dto/request/update-payment";
import { PaymentStatus } from "src/shared/constants/payment.constant";
import envConfig from "src/shared/config/config";
import { PaymentType } from "./schema/payment.schema";
import { SubscriptionService } from "../subscription/subscription.service";
import { CreatePaymentInput } from "./dto/request/create-payment";
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentRepo {
    constructor(private readonly prisma: PrismaService, private readonly subscriptionService: SubscriptionService) { }

    async createPayment(input: CreatePaymentInput) {
        const { user_id, membership_package_id } = input;

        const subscription = await this.subscriptionService.createSubscription({
            user_id,
            package_id: membership_package_id,
        });

        const user = await this.prisma.user.findUnique({
            where: {
                id: user_id,
            },
        })

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!subscription) {
            throw new NotFoundException('Subscription not found');
        }

        const existingPayment = await this.prisma.payment.findFirst({
            where: {
                user_id,
                subscription_id: subscription.id,
                status: PaymentStatus.PENDING
            }
        });

        if (existingPayment) {
            throw new BadRequestException('Payment already exists for this subscription');
        }

        const paymentId = uuidv4();

        const payment = await this.prisma.payment.create({
            data: {
                id: paymentId,
                user_id,
                subscription_id: subscription.id,
                status: PaymentStatus.PENDING,
                content: envConfig.PREFIX_PAYMENT_CODE + paymentId
            },
        });

        return payment;
    }

    async getPayments() {
        return this.prisma.payment.findMany();
    }

    async getPaymentById(id: string) {
        return this.prisma.payment.findUnique({
            where: {
                id,
            },
        });
    }

    async updatePayment(input: UpdatePaymentInput) {
        return this.prisma.payment.update({
            where: {
                id: input.id,
            },
            data: {
                status: input.status,
            },
        });
    }
}

