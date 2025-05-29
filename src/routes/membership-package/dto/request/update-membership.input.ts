import { Field, InputType, Int } from "@nestjs/graphql";
import { UpdateMembershipPackageSchema } from "../../schema/update-membership.schema";
import { createZodDto } from "nestjs-zod";

@InputType()
export class UpdateMembershipPackageInput extends createZodDto(UpdateMembershipPackageSchema) {
    @Field(() => String)
    id: string

    @Field(() => String, { nullable: true })
    name?: string

    @Field(() => String, { nullable: true })
    description?: string

    @Field(() => Int, { nullable: true })
    price?: number

    @Field(() => Int, { nullable: true })
    duration_days?: number
}