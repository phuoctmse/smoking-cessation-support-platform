import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";
import { CreatePaymentInput } from "./dto/request/create-payment";
import { UpdatePaymentInput } from "./dto/request/update-payment";
import { PaymentStatus } from "src/shared/constants/payment.constant";

@Injectable()
export class PaymentRepo {
    constructor(private readonly prisma: PrismaService) { }

    async createPayment(input: CreatePaymentInput) {
        const { user_id, subscription_id } = input;

        const [user, subscription] = await Promise.all([
            this.prisma.user.findUnique({
                where: {
                    id: user_id,
                },
            }),
            this.prisma.subscription.findUnique({
                where: {
                    id: subscription_id,
                },
            }),
        ]);

        console.log(user, subscription)

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!subscription) {
            throw new NotFoundException('Subscription not found');
        }

        const existingPayment = await this.prisma.payment.findFirst({
            where: {
                user_id,
                subscription_id,
                status: PaymentStatus.PENDING
            }
        });

        if (existingPayment) {
            throw new BadRequestException('Payment already exists for this subscription');
        }

        const payment = await this.prisma.payment.create({
            data: {
                user_id,
                subscription_id,
                status: PaymentStatus.PENDING,
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

