import { Module } from '@nestjs/common';
import { MembershipResolver } from './membership.resolver';
import { MembershipService } from './membership.service';
import { MembershipRepo } from './membership.repo';
import { GuardModule } from 'src/shared/guards/guard.module';
import { SupabaseModule } from 'src/shared/modules/supabase.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import envConfig from 'src/shared/config/config';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      url: envConfig.REDIS_URL,
      // ttl: 60 * 60 * 24 * 30,
      ttl: 60 * 60,
      isGlobal: true
    }),
    GuardModule,
    SupabaseModule
  ],
  providers: [MembershipResolver, MembershipService, MembershipRepo],
  exports: [MembershipService],
})

export class MembershipModule { }