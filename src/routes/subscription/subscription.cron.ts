import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/shared/services/prisma.service';
import { SubscriptionStatus } from 'src/shared/constants/subscription.constant';

@Injectable()
export class SubscriptionCronService {
    private readonly logger = new Logger(SubscriptionCronService.name);

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    @Cron(CronExpression.EVERY_HOUR)
    async handleExpiredSubscriptions() {
        this.logger.log('Checking for expired subscriptions...');

        try {
            // Update expired subscriptions
            const expiredSubscriptions = await this.prismaService.subscription.updateMany({
                where: {
                    status: SubscriptionStatus.Active,
                    end_date: {
                        lt: new Date()
                    }
                },
                data: {
                    status: SubscriptionStatus.Expired
                }
            });

            this.logger.log(`Updated ${expiredSubscriptions.count} expired subscriptions`);

        } catch (error) {
            this.logger.error('Error updating expired subscriptions:', error);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async calculateEndDates() {
        this.logger.log('Calculating end dates for subscriptions...');

        try {
            // Get all active subscriptions without end_date
            const subscriptions = await this.prismaService.subscription.findMany({
                where: {
                    status: SubscriptionStatus.Active,
                    end_date: null
                },
                include: {
                    package: true
                }
            });

            // Update end_date for each subscription
            for (const subscription of subscriptions) {
                const endDate = new Date(subscription.start_date);
                endDate.setDate(endDate.getDate() + subscription.package.duration_days);

                await this.prismaService.subscription.update({
                    where: {
                        id: subscription.id
                    },
                    data: {
                        end_date: endDate
                    }
                });
            }

            this.logger.log(`Calculated end dates for ${subscriptions.length} subscriptions`);

        } catch (error) {
            this.logger.error('Error calculating subscription end dates:', error);
        }
    }
} 