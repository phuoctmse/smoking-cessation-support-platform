import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/services/prisma.service";

@Injectable()
export class MembershipRepo {
    constructor(private readonly prisma: PrismaService) {}
}