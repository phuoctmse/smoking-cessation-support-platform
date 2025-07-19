import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthResolver } from './auth.resolver'
import { UserModule } from '../user/user.module'
import { HashingService } from 'src/shared/services/hashing.service'
import { AuthRepository } from './auth.repository'
import { GuardModule } from 'src/shared/guards/guard.module'
import { BlacklistGuard } from 'src/shared/guards/blacklist.guard'
import { SupabaseModule } from 'src/shared/modules/supabase.module'
import { PrismaService } from 'src/shared/services/prisma.service'

@Module({
  imports: [UserModule, GuardModule, SupabaseModule],
  providers: [AuthResolver, AuthService, AuthRepository, PrismaService],
})
export class AuthModule {}
