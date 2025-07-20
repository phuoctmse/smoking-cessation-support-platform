import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';
import {SupabaseModule} from "../../shared/modules/supabase.module";
import { GuardModule } from '../../shared/guards/guard.module'
import { NotificationRepository } from './notification.repository'
import { NotificationTemplateModule } from '../notification-template/notification-template.module'
import { NotificationCronService } from './notification.cron'
import { NotificationEventService } from './notification.event';

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    NotificationTemplateModule,
  ],
  providers: [
    NotificationResolver,
    NotificationService,
    NotificationRepository,
    NotificationCronService,
    NotificationEventService,
  ],
  exports: [
    NotificationService,
    NotificationCronService,
    NotificationEventService,
    NotificationRepository,
  ],
})
export class NotificationModule {}