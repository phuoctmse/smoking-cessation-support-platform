import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserResolver } from './user.resolver'
import { GuardModule } from 'src/shared/guards/guard.module'
import { SupabaseModule } from 'src/shared/modules/supabase.module'
import { UserRepo } from './user.repo'
import { PrismaService } from 'src/shared/services/prisma.service'

@Module({
  imports: [GuardModule, SupabaseModule],
  providers: [UserResolver, UserService, UserRepo, PrismaService],
})
export class UserModule {}
