import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { HashingService } from './services/hashing.service';

const sharedService = [PrismaService, HashingService]

@Global()
@Module({
    providers: [...sharedService],
    exports: [...sharedService]
})
export class SharedModule {
}
