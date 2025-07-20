import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";
import { CreateSubscriptionSchemaType } from "./schema/create-subscription.schema";
import { SubscriptionStatus } from "@prisma/client";
import { UpdateSubscriptionSchemaType } from "./schema/update-subscription.schema";
import { MembershipService } from "../membership-package/membership.service";

@Injectable()
export class SubscriptionRepo {
    constructor(private readonly prisma: PrismaService, private readonly membershipService: MembershipService) { }

    async create(input: CreateSubscriptionSchemaType) {
        const membershipPackage = await this.membershipService.findById(input.package_id);
        if (input.package_id !== membershipPackage.id) {
            throw new BadRequestException('Membership package not found');
        }
        const start_date = new Date()
        const end_date = new Date(start_date.getTime() + membershipPackage.duration_days * 24 * 60 * 60 * 1000)
        const subscription = await this.prisma.userSubscription.create({
            data: {
                user_id: input.user_id,
                package_id: input.package_id,
                start_date: start_date,
                end_date: end_date,
            }
        })
        return subscription
    }

    async getUserSubscription(user_id: string) {
        const subscription = await this.prisma.userSubscription.findMany({
            where: { user_id }
        })
        if (subscription.length === 0) {
            throw new NotFoundException('Subscription not found')
        }
        return subscription
    }

    async update(input: UpdateSubscriptionSchemaType) {
        const subscription = await this.prisma.userSubscription.update({
            where: { id: input.id },
            data: {
                status: input.status,
                start_date: input.start_date,
                end_date: input.end_date,
            }
        })
        return subscription
    }

}

