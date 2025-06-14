import { Module } from '@nestjs/common';

import { PrismaService } from 'src/shared/services/prisma.service';
import { TransactionController } from './transaction.controller';
import { TransactionRepo } from './transaction.repo';
import { TransactionService } from './transaction.service';

@Module({
    controllers: [TransactionController],
    providers: [TransactionService, TransactionRepo, PrismaService]
})
export class TransactionModule { }
