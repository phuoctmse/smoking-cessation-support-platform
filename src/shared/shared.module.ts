import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { HashingService } from './services/hashing.service';
import { TokenService } from './services/token.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from './guards/passport.module';

const sharedService = [PrismaService, HashingService, TokenService, PassportModule]

@Global()
@Module({
    providers: [...sharedService],
    exports: [...sharedService],
    imports: [JwtModule]
})
export class SharedModule {
}
