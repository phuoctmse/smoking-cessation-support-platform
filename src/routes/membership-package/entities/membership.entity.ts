import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { MembershipPackageType } from "../schema/membership.schema";

@ObjectType()
export class MembershipPackage implements MembershipPackageType {
    @Field(() => ID)
    id: string

    @Field(() => String)
    name: string

    @Field(() => String)
    description: string

    @Field(() => Int)
    price: number

    @Field(() => Int)
    duration_days: number

    @Field(() => Date)
    created_at: Date

    @Field(() => Date)
    updated_at: Date

}