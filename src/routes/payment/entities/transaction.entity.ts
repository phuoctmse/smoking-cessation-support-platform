import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { PaymentEntity } from "./payment.entity";

@ObjectType()
export class PaymentTransactionEntity {
    @Field(() => ID)
    id: string;

    @Field(() => ID)
    payment_id: string;

    @Field(() => String)
    payment: string;

    @Field(() => String)
    gateway: string;

    @Field(() => Date)
    transactionDate: Date;

    @Field(() => String)
    accountNumber?: string;

    @Field(() => String)
    subAccount?: string;

    @Field(() => Int)
    amountIn: number;

    @Field(() => Int)
    amountOut: number;

    @Field(() => Int)
    accumulated: number;

    @Field(() => String)
    code?: string;

    @Field(() => String)
    transactionContent?: string;

    @Field(() => String)
    referenceNumber?: string;

    @Field(() => String)
    body?: string;

    @Field(() => Date)
    createdAt: Date;
}