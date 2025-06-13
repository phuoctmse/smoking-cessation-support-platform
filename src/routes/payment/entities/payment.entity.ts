import { Field, ID, ObjectType } from "@nestjs/graphql";
import { PaymentStatus } from "src/shared/constants/payment.constant";

@ObjectType()
export class PaymentEntity {
    @Field(() => ID)
    id: string;

    @Field(() => ID)
    user_id: string;

    @Field(() => ID)
    subscription_id: string;

    @Field(() => PaymentStatus)
    status: PaymentStatus;

}