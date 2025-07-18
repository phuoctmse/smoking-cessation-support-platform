import { Global, Module } from '@nestjs/common'
import { PrismaService } from './services/prisma.service'
import { HashingService } from './services/hashing.service'
import { TokenService } from './services/token.service'
import { JwtModule } from '@nestjs/jwt'
import { RedisServices } from './services/redis.service'
import { GuardModule } from './guards/guard.module'
import { SupabaseModule } from './modules/supabase.module'
import { SupabaseStorageService } from './services/supabase-storage.service'
import { UploadService } from './services/upload-file.service'
import { CustomElasticsearchModule } from './modules/elasticsearch.module'
import { CustomElasticsearchService } from './services/elasticsearch.service'
import { HealthController } from './controllers/health.controller'
import { DataSyncService } from './services/data-sync.service'
import { CronJobService } from './services/cronjob.service'
import { CronJobManagementService } from './services/cronjob-management.service'
import { ScheduleModule } from '@nestjs/schedule'

const sharedService = [
  PrismaService,
  HashingService,
  TokenService,
  RedisServices,
  SupabaseStorageService,
  UploadService,
  CustomElasticsearchService,
  DataSyncService,
  CronJobService,
  CronJobManagementService
]

@Global()
@Module({
  providers: [...sharedService],
  controllers: [HealthController],
  exports: [...sharedService, SupabaseModule, CustomElasticsearchModule],
  imports: [JwtModule, GuardModule, SupabaseModule, CustomElasticsearchModule, ScheduleModule.forRoot()],
})
export class SharedModule {}
