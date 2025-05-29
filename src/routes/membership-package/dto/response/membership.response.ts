import { Field, ObjectType } from "@nestjs/graphql";
import { createZodDto } from "nestjs-zod";
import { MembershipPackageSchema } from "../../schema/membership.schema";
import { MembershipPackage } from "../../entities/membership.entity";

@ObjectType()
export class MembershipResponse extends createZodDto(MembershipPackageSchema) {
    @Field(() => MembershipPackage)
    membership: MembershipPackage
}