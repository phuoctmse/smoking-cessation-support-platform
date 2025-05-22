import { Global, Module } from '@nestjs/common'
import { PrismaService } from './services/prisma.service'
import { HashingService } from './services/hashing.service'
import { TokenService } from './services/token.service'
import { JwtModule } from '@nestjs/jwt'
import { RedisServices } from './services/redis.service'
import { GuardModule } from './guards/guard.module'
import { CloudinaryService } from './services/cloudinary.service'
import { CloudinaryModule } from './modules/cloudinary.module'

const sharedService = [
  PrismaService,
  HashingService,
  TokenService,
  RedisServices,
  CloudinaryService
]

@Global()
@Module({
  providers: [...sharedService],
  exports: [...sharedService],
  imports: [JwtModule, GuardModule, CloudinaryModule],
})
export class SharedModule {}
