import { Field, InputType, PartialType } from "@nestjs/graphql";
import { createZodDto } from "nestjs-zod";
import { paymentSchema } from "../../schema/payment.schema";
import { CreatePaymentInput } from "./create-payment";

@InputType()
export class UpdatePaymentInput extends PartialType(CreatePaymentInput) {
    @Field(() => String)
    id: string;
}