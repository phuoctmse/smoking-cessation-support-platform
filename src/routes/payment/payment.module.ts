import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentRepo } from "./payment.repo";
import { PrismaService } from "src/shared/services/prisma.service";
import { PaymentResolver } from "./payment.resolver";

@Module({
    imports: [],
    providers: [PaymentService, PaymentRepo, PrismaService, PaymentResolver],
    exports: [PaymentService],
})
export class PaymentModule {}