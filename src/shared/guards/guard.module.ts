import { Module } from '@nestjs/common'
import { JwtStrategy } from './jwt.strategy'
import { PassportModule } from '@nestjs/passport'
import { BlacklistGuard } from './blacklist.guard'
import { JwtAuthGuard } from './jwt-auth.guard'

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy, BlacklistGuard],
  exports: [JwtStrategy, BlacklistGuard],
})
export class GuardModule {}
