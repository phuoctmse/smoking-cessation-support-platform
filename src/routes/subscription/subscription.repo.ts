import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";
import { CreateSubscriptionSchemaType } from "./schema/create-subscription.schema";
import { SubscriptionStatus } from "@prisma/client";
import { UpdateSubscriptionSchemaType } from "./schema/update-subscription.schema";

@Injectable()
export class SubscriptionRepo {
    constructor(private readonly prisma: PrismaService) { }

    async create(input: CreateSubscriptionSchemaType) {
        const subscription = await this.prisma.subscription.create({
            data: {
                user_id: input.user_id,
                package_id: input.package_id,
                start_date: input.start_date,
                end_date: input.end_date,
            }
        })
        return subscription
    }

    async getUserSubscription(user_id: string) {
        const subscription = await this.prisma.subscription.findFirst({
            where: { user_id }
        })
        return subscription
    }

    async update(id: string, input: UpdateSubscriptionSchemaType) {
        const subscription = await this.prisma.subscription.update({
            where: { id },
            data: {
                status: input.status,
                start_date: input.start_date,
                end_date: input.end_date,
            }
        })
        return subscription
    }

}

