import { Field, InputType, PartialType } from "@nestjs/graphql";
import { CreatePaymentInput } from "./create-payment";

@InputType()
export class UpdatePaymentInput extends PartialType(CreatePaymentInput) {
    @Field(() => String)
    id: string;
}