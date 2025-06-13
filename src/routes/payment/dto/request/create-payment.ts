import { Field, InputType } from "@nestjs/graphql";
import { createZodDto } from "nestjs-zod";
import { paymentSchema } from "../../schema/payment.schema";

@InputType()
export class CreatePaymentInput extends createZodDto(paymentSchema) {
    @Field(() => String)
    user_id: string;

    @Field(() => String)
    subscription_id: string;
}