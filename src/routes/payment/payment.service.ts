import { Injectable } from "@nestjs/common";
import { PaymentRepo } from "./payment.repo";
import { CreatePaymentInput } from "./dto/request/create-payment";
import { UpdatePaymentInput } from "./dto/request/update-payment";
import { PaymentType } from "./schema/payment.schema";
import { EventService } from "src/shared/services/event.service";
import { PaymentStatus } from "src/shared/constants/payment.constant";

@Injectable()
export class PaymentService {
    constructor(
        private readonly paymentRepo: PaymentRepo,
    ) {
    }

    async createPayment(input: CreatePaymentInput, user_id: string): Promise<PaymentType> {
        // Create initial payment record
        const payment = await this.paymentRepo.createPayment(input, user_id);

        return payment;
    }

    async getPayments(user_id: string) {
        return this.paymentRepo.getPayments(user_id);
    }

    async getPaymentById(id: string) {
        return this.paymentRepo.getPaymentById(id);
    }

    async updatePayment(input: UpdatePaymentInput) {
        return this.paymentRepo.updatePayment(input);
    }

    // async createPaymentTransaction(input: CreatePaymentTransactionInput) {
}

