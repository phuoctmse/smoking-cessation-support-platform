import { Module } from '@nestjs/common';
import { MembershipResolver } from './membership.resolver';
import { MembershipService } from './membership.service';
import { MembershipRepo } from './membership.repo';

@Module({
  imports: [],
  providers: [MembershipResolver, MembershipService, MembershipRepo],
  exports: [],
})

export class MembershipModule {}