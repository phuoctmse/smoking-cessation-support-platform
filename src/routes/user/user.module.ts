import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserResolver } from './user.resolver'
import { GuardModule } from 'src/shared/guards/guard.module'
import { SupabaseModule } from 'src/shared/modules/supabase.module'
import { UserRepository } from './user.repo'
import { PrismaService } from 'src/shared/services/prisma.service'
import { AuthRepository } from '../auth/auth.repository'

@Module({
  imports: [GuardModule, SupabaseModule],
  providers: [UserResolver, UserService, UserRepository, PrismaService, AuthRepository],
})
export class UserModule {}
