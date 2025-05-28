import { Injectable } from "@nestjs/common";
import { MembershipRepo } from "./membership.repo";

@Injectable()
export class MembershipService {
    constructor(private readonly membershipRepo: MembershipRepo) {}
}