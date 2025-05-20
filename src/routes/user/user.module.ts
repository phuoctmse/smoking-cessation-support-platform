import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserResolver } from './user.resolver'
import { GuardModule } from 'src/shared/guards/guard.module'

@Module({
  imports: [GuardModule],
  providers: [UserResolver, UserService],
})
export class UserModule {}
