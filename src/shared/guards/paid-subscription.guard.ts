import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../services/prisma.service';
import { SubscriptionStatus } from '../constants/subscription.constant';

@Injectable()
export class PaidSubscriptionGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const { user } = ctx.getContext().req;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Check if user has any active subscriptions
        const activeSubscriptions = await this.prisma.userSubscription.findMany({
            where: {
                user_id: user.id,
                status: SubscriptionStatus.Active
            }
        });

        if (activeSubscriptions.length > 0) {
            throw new ForbiddenException('You already have an active subscription. Cannot create new payment.');
        }

        return true;
    }
}