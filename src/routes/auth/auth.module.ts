import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UserModule } from '../user/user.module';
import { HashingService } from 'src/shared/services/hashing.service';
import { AuthRepository } from './auth.repository';

@Module({
  imports: [UserModule],
  providers: [AuthResolver, AuthService, AuthRepository],
})
export class AuthModule {}
