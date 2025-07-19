import { Field, ID, ObjectType } from "@nestjs/graphql";
import { SubscriptionStatus, SubscriptionStatusType } from "src/shared/constants/subscription.constant";
import { SubscriptionSchema } from "../schema/subscription.schema";
import { createZodDto } from "nestjs-zod";

@ObjectType()
export class UserSubscription extends createZodDto(SubscriptionSchema) {
    @Field(() => ID)
    id: string

    @Field(() => String)
    user_id: string

    @Field(() => String)
    package_id: string

    @Field(() => SubscriptionStatus)
    status: SubscriptionStatusType

    @Field(() => Date)
    start_date: Date

    @Field(() => Date)
    end_date: Date

    @Field(() => Date)
    created_at: Date

    @Field(() => Date)
    updated_at: Date
}
