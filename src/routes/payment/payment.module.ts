import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentRepo } from "./payment.repo";
import { PrismaService } from "src/shared/services/prisma.service";

@Module({
    imports: [],
    providers: [PaymentService, PaymentRepo, PrismaService],
    exports: [PaymentService],
})
export class PaymentModule {}