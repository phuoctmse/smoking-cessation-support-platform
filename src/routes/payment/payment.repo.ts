import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";
import { CreatePaymentInput } from "./dto/request/create-payment";
import { UpdatePaymentInput } from "./dto/request/update-payment";

@Injectable()
export class PaymentRepo {
    constructor(private readonly prisma: PrismaService) { }

    async createPayment(input: CreatePaymentInput) {
        return this.prisma.payment.create({
            data: input,
        });
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
            data: input,
        });
    }
}

