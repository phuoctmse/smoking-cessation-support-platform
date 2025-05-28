import { Resolver } from "@nestjs/graphql";
import { MembershipService } from "./membership.service";

@Resolver()
export class MembershipResolver {
    constructor(private readonly membershipService: MembershipService) {}
}