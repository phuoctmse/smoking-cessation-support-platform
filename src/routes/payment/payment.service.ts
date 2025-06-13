import { Injectable } from "@nestjs/common";
import { PaymentRepo } from "./payment.repo";
import { CreatePaymentInput } from "./dto/request/create-payment";
import { UpdatePaymentInput } from "./dto/request/update-payment";

@Injectable()
export class PaymentService {
    constructor(private readonly paymentRepo: PaymentRepo) { }

    async createPayment(input: CreatePaymentInput) {
        return this.paymentRepo.createPayment(input);
    }

    async getPayments() {
        return this.paymentRepo.getPayments();
    }

    async getPaymentById(id: string) {
        return this.paymentRepo.getPaymentById(id);
    }

    async updatePayment(input: UpdatePaymentInput) {
        return this.paymentRepo.updatePayment(input);
    }

    // async createPaymentTransaction(input: CreatePaymentTransactionInput) {
}

