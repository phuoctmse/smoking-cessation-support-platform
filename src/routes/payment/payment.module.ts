import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentRepo } from "./payment.repo";
import { PrismaService } from "src/shared/services/prisma.service";
import { PaymentResolver } from "./payment.resolver";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { EventService } from "src/shared/services/event.service";
import { SubscriptionModule } from "../subscription/subscription.module";
import { MembershipModule } from "../membership-package/membership.module";
import { GuardModule } from "src/shared/guards/guard.module";

@Module({
    imports: [
        EventEmitterModule.forRoot(),
        SubscriptionModule,
        MembershipModule,
        GuardModule
    ],
    providers: [PaymentService, PaymentRepo, PrismaService, PaymentResolver, EventService],
    exports: [PaymentService],
})
export class PaymentModule { }