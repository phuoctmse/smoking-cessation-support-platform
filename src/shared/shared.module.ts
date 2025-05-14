import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';

const sharedService = [PrismaService]

@Global()
@Module({
    providers: [...sharedService],
    exports: [...sharedService]
})
export class SharedModule {
}
