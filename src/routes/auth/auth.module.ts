import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UserModule } from '../user/user.module';
import { HashingService } from 'src/shared/services/hashing.service';
import { AuthRepository } from './auth.repository';
import { GuardModule } from 'src/shared/guards/guard.module';
import { BlacklistGuard } from 'src/shared/guards/blacklist.guard';

@Module({
  imports: [UserModule, GuardModule],
  providers: [AuthResolver, AuthService, AuthRepository],
})
export class AuthModule {}
