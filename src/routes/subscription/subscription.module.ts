import { Module } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { SubscriptionRepo } from "./subscription.repo";
import { PrismaService } from "src/shared/services/prisma.service";

@Module({
    imports: [],
    providers: [SubscriptionService, SubscriptionRepo, PrismaService],
    exports: [],
})
export class SubscriptionModule { }