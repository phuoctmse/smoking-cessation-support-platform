import { Field, InputType, Int } from "@nestjs/graphql";
import { CreateMembershipPackageSchema } from "../../schema/create-membership.schema";
import { createZodDto } from "nestjs-zod";

@InputType()
export class CreateMembershipPackageInput extends createZodDto(CreateMembershipPackageSchema) {
    @Field(() => String)
    name: string

    @Field(() => String)
    description: string

    @Field(() => Int)
    price: number

    @Field(() => Int)
    duration_days: number
}