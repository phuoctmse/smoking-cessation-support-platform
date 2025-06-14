import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { PaymentService } from "./payment.service";
import { PaymentEntity } from "./entities/payment.entity";
import { CreatePaymentInput } from "./dto/request/create-payment";
import { UpdatePaymentInput } from "./dto/request/update-payment";

@Resolver()
export class PaymentResolver {
    constructor(private readonly paymentService: PaymentService) { }

    @Query(() => [PaymentEntity])
    async getPayments() {
        return this.paymentService.getPayments();
    }

    @Query(() => PaymentEntity)
    async getPaymentById(@Args('id') id: string) {
        return this.paymentService.getPaymentById(id);
    }

    @Mutation(() => PaymentEntity)
    async createPayment(@Args('input') input: CreatePaymentInput) {
        return this.paymentService.createPayment(input);
    }

    @Mutation(() => PaymentEntity)
    async updatePayment(@Args('input') input: UpdatePaymentInput) {
        return this.paymentService.updatePayment(input);
    }

    // @Mutation(() => PaymentTransactionEntity)
    // async createPaymentTransaction(@Args('input') input: PaymentTransactionType) {
    //     return this.paymentService.createPaymentTransaction(input);
    // }

    // @Mutation(() => PaymentTransactionEntity)
    // async updatePaymentTransaction(@Args('input') input: PaymentTransactionType) {
    //     return this.paymentService.updatePaymentTransaction(input);
    // }

    // @Mutation(() => PaymentTransactionEntity)
    // async deletePaymentTransaction(@Args('input') input: PaymentTransactionType) {
    //     return this.paymentService.deletePaymentTransaction(input);
    // }

}