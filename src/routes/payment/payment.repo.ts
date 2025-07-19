import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";
import { UpdatePaymentInput } from "./dto/request/update-payment";
import { PaymentStatus } from "src/shared/constants/payment.constant";
import envConfig from "src/shared/config/config";
import { PaymentType } from "./schema/payment.schema";
import { SubscriptionService } from "../subscription/subscription.service";
import { CreatePaymentInput } from "./dto/request/create-payment";
import { v4 as uuidv4 } from 'uuid';
import { MembershipService } from "../membership-package/membership.service";

@Injectable()
export class PaymentRepo {
    constructor(private readonly prisma: PrismaService, private readonly subscriptionService: SubscriptionService, private readonly membershipService: MembershipService) { }

    async createPayment(input: CreatePaymentInput, user_id: string) {
        const { membership_package_id } = input;

        const membershipPackage = await this.membershipService.findById(membership_package_id);

        const subscription = await this.subscriptionService.createSubscription({
            user_id,
            package_id: membershipPackage.id,
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
                content: envConfig.PREFIX_PAYMENT_CODE + "_" + paymentId,
                price: membershipPackage.price
            },
        });

        return payment;
    }

    async getPayments(user_id: string) {
        return this.prisma.payment.findMany({
            where: {
                user_id
            }
        });
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

