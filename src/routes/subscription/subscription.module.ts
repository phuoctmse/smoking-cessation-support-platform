import { Module } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { SubscriptionRepo } from "./subscription.repo";
import { PrismaService } from "src/shared/services/prisma.service";
import { GuardModule } from "src/shared/guards/guard.module";
import { SubscriptionResolver } from "./subscription.resolver";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";
import { SupabaseModule } from "src/shared/modules/supabase.module";
import { MembershipModule } from "../membership-package/membership.module";

@Module({
    imports: [GuardModule, SupabaseModule, MembershipModule],
    providers: [SubscriptionService, SubscriptionRepo, PrismaService, SubscriptionResolver],
    exports: [SubscriptionService],
})
export class SubscriptionModule { }