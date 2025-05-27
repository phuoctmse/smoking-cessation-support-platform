import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserResolver } from './user.resolver'
import { GuardModule } from 'src/shared/guards/guard.module'
import { SupabaseModule } from 'src/shared/modules/supabase.module'

@Module({
  imports: [GuardModule, SupabaseModule],
  providers: [UserResolver, UserService],
})
export class UserModule {}
