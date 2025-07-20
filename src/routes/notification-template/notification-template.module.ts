import { Module } from '@nestjs/common';
import { NotificationTemplateResolver } from './notification-template.resolver';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationTemplateRepository } from './notification-template.repository';
import { GuardModule } from '../../shared/guards/guard.module';
import { SupabaseModule } from '../../shared/modules/supabase.module';

@Module({
  imports: [GuardModule, SupabaseModule],
  providers: [
    NotificationTemplateResolver,
    NotificationTemplateService,
    NotificationTemplateRepository,
  ],
  exports: [
    NotificationTemplateService,
    NotificationTemplateRepository,
  ],
})
export class NotificationTemplateModule {}