import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { PaymentService } from "./payment.service";
import { PaymentEntity } from "./entities/payment.entity";
import { CreatePaymentInput } from "./dto/request/create-payment";
import { UpdatePaymentInput } from "./dto/request/update-payment";
import { UseGuards } from "@nestjs/common";
import { PaidSubscriptionGuard } from "src/shared/guards/paid-subscription.guard";
import { CurrentUser } from "src/shared/decorators/current-user.decorator";
import { UserType } from "../user/schema/user.schema";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";
import { Roles } from "src/shared/decorators/roles.decorator";

@Resolver()
@UseGuards(JwtAuthGuard)
export class PaymentResolver {
    constructor(private readonly paymentService: PaymentService) { }

    @Query(() => [PaymentEntity])
    async getPayments(@CurrentUser() user: UserType) {
        return this.paymentService.getPayments(user.id);
    }

    @Query(() => PaymentEntity)
    async getPaymentById(@Args('id') id: string) {
        return this.paymentService.getPaymentById(id);
    }

    @UseGuards(PaidSubscriptionGuard)
    @Mutation(() => PaymentEntity)
    async createPayment(@Args('input') input: CreatePaymentInput,
        @CurrentUser() user: UserType) {
        return this.paymentService.createPayment(input, user.id);
    }

    @Mutation(() => PaymentEntity)
    @Roles("ADMIN")
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