import { UpdateSubscriptionSchema } from "src/routes/subscription/schema/update-subscription.schema";
import { createZodDto } from "nestjs-zod";
import { Field, InputType } from "@nestjs/graphql";
import { SubscriptionStatus, SubscriptionStatusType } from "src/shared/constants/subscription.constant";

@InputType()
export class UpdateSubscriptionInput extends createZodDto(UpdateSubscriptionSchema) {
    @Field(() => String)
    id: string;

    @Field(() => SubscriptionStatus)
    status: SubscriptionStatusType;
}