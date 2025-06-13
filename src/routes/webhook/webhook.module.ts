import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookRepo } from './webhook.repo';
import { PrismaService } from 'src/shared/services/prisma.service';

@Module({
    controllers: [WebhookController],
    providers: [WebhookService, WebhookRepo, PrismaService]
})
export class WebhookModule { }
