import { Field, InputType } from "@nestjs/graphql";
import { SubscriptionSchema } from "../../schema/subscription.schema";
import { CreateSubscriptionSchema, CreateSubscriptionSchemaType } from "../../schema/create-subscription.schema";
import { createZodDto } from "nestjs-zod";

@InputType()
export class CreateSubscriptionInput extends createZodDto(CreateSubscriptionSchema) {
    @Field(() => String)
    user_id: string

    @Field(() => String)
    package_id: string
}
