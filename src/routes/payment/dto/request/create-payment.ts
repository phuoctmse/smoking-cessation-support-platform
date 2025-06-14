import { Field, InputType } from "@nestjs/graphql";
import { createZodDto } from "nestjs-zod";
import { paymentSchema, PaymentType } from "../../schema/payment.schema";

@InputType()
export class CreatePaymentInput implements PaymentType {
    @Field(() => String)
    user_id: string;

    @Field(() => String)
    subscription_id: string;
}