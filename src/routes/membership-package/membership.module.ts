import { Module } from '@nestjs/common';
import { MembershipResolver } from './membership.resolver';
import { MembershipService } from './membership.service';
import { MembershipRepo } from './membership.repo';
import { GuardModule } from 'src/shared/guards/guard.module';
import { SupabaseModule } from 'src/shared/modules/supabase.module';

@Module({
  imports: [GuardModule, SupabaseModule],
  providers: [MembershipResolver, MembershipService, MembershipRepo],
  exports: [],
})

export class MembershipModule {}