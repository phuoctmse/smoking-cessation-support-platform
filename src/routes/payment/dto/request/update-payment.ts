import { Field, InputType, PartialType } from "@nestjs/graphql";
import { CreatePaymentInput } from "./create-payment";
import { PaymentStatus, PaymentStatusType } from "src/shared/constants/payment.constant";

@InputType()
export class UpdatePaymentInput extends PartialType(CreatePaymentInput) {
    @Field(() => String)
    id: string;

    @Field(() => PaymentStatus)
    status: PaymentStatusType;
}