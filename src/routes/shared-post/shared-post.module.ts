import { Module } from '@nestjs/common';
import { SharedPostService } from './shared-post.service';
import { SharedPostResolver } from './shared-post.resolver';
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { UserBadgeModule } from '../user-badge/user-badge.module'
import { SharedPostRepository } from './shared-post.repository'

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    UserBadgeModule,
  ],
  providers: [SharedPostResolver, SharedPostService, SharedPostRepository],
  exports: [SharedPostService, SharedPostRepository],
})
export class SharedPostModule {}
