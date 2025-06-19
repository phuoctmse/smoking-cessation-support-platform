import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { MembershipService } from "./membership.service";
import { MembershipPackage } from "./entities/membership.entity";
import { CreateMembershipPackageInput } from "./dto/request/create-membership.input";
import { MembershipPackageType } from "./schema/membership.schema";
import { UpdateMembershipPackageInput } from "./dto/request/update-membership.input";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";
import { RolesGuard } from "src/shared/guards/roles.guard";
import { Roles } from "src/shared/decorators/roles.decorator";
import { RoleName } from '../../shared/constants/role.constant'

@Resolver()
export class MembershipResolver {
    constructor(private readonly membershipService: MembershipService) {}

    @Query(() => [MembershipPackage])
    async getMembershipPackages() {
        return this.membershipService.findAll()
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleName.Admin)
    @Mutation(() => MembershipPackage)
    async createMembershipPackage(@Args('input') input: CreateMembershipPackageInput) {
        return this.membershipService.create(input)
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleName.Admin)
    @Mutation(() => MembershipPackage)
    async updateMembershipPackage(@Args('input') input: UpdateMembershipPackageInput) {
        return this.membershipService.update(input.id, input)
    }
}