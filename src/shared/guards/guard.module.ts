import { Module } from '@nestjs/common'
import { JwtStrategy } from './jwt.strategy'
import { PassportModule } from '@nestjs/passport'
import { BlacklistGuard } from './blacklist.guard'
import { JwtAuthGuard } from './jwt-auth.guard'
import { SupabaseModule } from '../modules/supabase.module'
import { PrismaService } from '../services/prisma.service'

@Module({
  imports: [PassportModule, SupabaseModule],
  providers: [JwtStrategy, BlacklistGuard, JwtAuthGuard, PrismaService],
  exports: [JwtStrategy, BlacklistGuard, JwtAuthGuard],
})
export class GuardModule {}