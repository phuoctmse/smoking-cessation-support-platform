import { Module } from '@nestjs/common';
import { BadgeService } from './badge.service';
import { BadgeResolver } from './badge.resolver';
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { GuardModule } from '../../shared/guards/guard.module'
import { BadgeRepository } from './badge.repository'
import { BadgeTypeModule } from '../badge-type/badge-type.module'

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    BadgeTypeModule,
  ],
  providers: [BadgeResolver, BadgeService, BadgeRepository],
  exports: [BadgeService, BadgeRepository],
})
export class BadgeModule {}