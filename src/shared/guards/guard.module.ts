import { Module } from '@nestjs/common'
import { JwtStrategy } from './jwt.strategy'
import { PassportModule } from '@nestjs/passport'
import { BlacklistGuard } from './blacklist.guard'
import { JwtAuthGuard } from './jwt-auth.guard'
import { SupabaseModule } from '../modules/supabase.module'
import { PrismaService } from '../services/prisma.service'
import { SubscriptionGuard } from './subscription.guard'
import { SubscriptionModule } from 'src/routes/subscription/subscription.module'
import { SubscriptionService } from 'src/routes/subscription/subscription.service'

@Module({
  imports: [PassportModule, SupabaseModule],
  providers: [JwtStrategy, BlacklistGuard, JwtAuthGuard, PrismaService, SubscriptionGuard],
  exports: [JwtStrategy, BlacklistGuard, JwtAuthGuard, SubscriptionGuard],
})
export class GuardModule {}