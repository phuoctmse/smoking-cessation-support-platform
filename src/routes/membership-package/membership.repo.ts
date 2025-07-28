import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";
import { MembershipPackageType } from "./schema/membership.schema";
import { CreateMembershipPackageType } from "./schema/create-membership.schema";
import { UpdateMembershipPackageType } from "./schema/update-membership.schema";

@Injectable()
export class MembershipRepo {
    constructor(private readonly prisma: PrismaService) { }

    async findMany(): Promise<MembershipPackageType[]> {
        return this.prisma.membershipPackage.findMany()
    }

    async findById(id: string): Promise<MembershipPackageType> {
        return this.prisma.membershipPackage.findUnique({
            where: {
                id
            }
        })
    }

    async create(input: CreateMembershipPackageType) {
        return this.prisma.membershipPackage.create({
            data: {
                name: input.name,
                description: input.description,
                price: input.price,
                duration_days: input.duration_days,
            }
        })
    }

    async update(input: UpdateMembershipPackageType) {
        return this.prisma.membershipPackage.update({
            where: {
                id: input.id
            },
            data: input
        })
    }

    async delete(id: string): Promise<MembershipPackageType> {
        return this.prisma.membershipPackage.delete({
            where: {
                id
            }
        })
    }

    async findActivePackages(): Promise<MembershipPackageType[]> {
        return this.prisma.membershipPackage.findMany({
            where: {
                is_active: true
            }
        })
    }

    async checkUsersUsingPackage(packageId: string): Promise<number> {
        const count = await this.prisma.userSubscription.count({
            where: {
                package_id: packageId,
                status: 'ACTIVE' 
            }
        })
        return count
    }
}