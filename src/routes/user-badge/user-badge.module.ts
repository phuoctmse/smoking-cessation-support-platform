import { Module } from '@nestjs/common';
import { UserBadgeService } from './user-badge.service';
import { UserBadgeResolver } from './user-badge.resolver';
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { UserBadgeRepository } from './user-badge.repository'
import { BadgeModule } from '../badge/badge.module'

@Module({
  imports: [GuardModule, SupabaseModule, BadgeModule],
  providers: [UserBadgeResolver, UserBadgeService, UserBadgeRepository],
  exports: [UserBadgeService, UserBadgeRepository],
})
export class UserBadgeModule {}
