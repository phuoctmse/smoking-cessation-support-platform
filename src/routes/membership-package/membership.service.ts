import { Injectable } from "@nestjs/common";
import { MembershipRepo } from "./membership.repo";
import { MembershipPackageType } from "./schema/membership.schema";
import { CreateMembershipPackageInput } from "./dto/request/create-membership.input";
import { CreateMembershipPackageType } from "./schema/create-membership.schema";
import { UpdateMembershipPackageType } from "./schema/update-membership.schema";

@Injectable()
export class MembershipService {
    constructor(private readonly membershipRepo: MembershipRepo) {}

    async getMembershipPackages(): Promise<MembershipPackageType[]> {
        return this.membershipRepo.findMany()
    }

    async getMembershipPackageById(id: string): Promise<MembershipPackageType> {
        return this.membershipRepo.findById(id)
    }

    async createMembershipPackage(input: CreateMembershipPackageType){
        return this.membershipRepo.create(input)
    }

    async updateMembershipPackage(input: UpdateMembershipPackageType){
        return this.membershipRepo.update(input)
    }
}