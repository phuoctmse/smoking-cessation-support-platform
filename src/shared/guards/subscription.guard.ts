import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { CanActivate } from "@nestjs/common";
import { SubscriptionService } from "src/routes/subscription/subscription.service";
import { SubscriptionStatus } from "../constants/subscription.constant";
import { PrismaService } from "../services/prisma.service";

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context)
        const request = ctx.getContext().req

        try {
            const user_id = request.user.id
            const subscription = await this.prisma.userSubscription.findFirst({
                where: {
                    user_id: user_id,
                    status: SubscriptionStatus.Active
                }
            })
            if (!subscription) {
                throw new UnauthorizedException('User does not have an active subscription')
            }
            return true
        } catch (error) {
            throw new UnauthorizedException('User does not have a subscription')
        }
    }
}