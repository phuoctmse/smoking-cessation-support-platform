import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { PaymentStatus, PaymentStatusType } from "src/shared/constants/payment.constant";
import { PaymentTransactionEntity } from "./transaction.entity";
import { PaymentType } from "../schema/payment.schema";

@ObjectType()
export class PaymentEntity implements PaymentType {
    @Field(() => ID)
    id: string;

    @Field(() => ID)
    user_id: string;

    @Field(() => ID)
    subscription_id: string;

    @Field(() => String, { nullable: true })
    content: string;

    @Field(() => PaymentStatus)
    status: PaymentStatusType;

    @Field(() => PaymentTransactionEntity, { nullable: true })
    payment_transaction: PaymentTransactionEntity;

    @Field(() => Int, { nullable: true })
    price: number;
}