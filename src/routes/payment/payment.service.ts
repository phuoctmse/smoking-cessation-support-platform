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
        private readonly eventService: EventService
    ) {
        // Listen for payment processed events
        this.eventService.onPaymentProcessed(this.handlePaymentProcessed.bind(this));
    }

    private async handlePaymentProcessed(payment: PaymentType) {
        // Update payment status in database
        await this.paymentRepo.updatePayment({
            id: payment.id,
            status: PaymentStatus.SUCCESS
        });
        return payment;
    }

    async createPayment(input: CreatePaymentInput): Promise<PaymentType> {
        // Create initial payment record
        const payment = await this.paymentRepo.createPayment({
            ...input,
            status: PaymentStatus.PENDING
        });

        // Emit payment event
        await this.eventService.emitPaymentEvent(payment);

        return payment;
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

