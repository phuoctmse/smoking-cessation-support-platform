import { Module } from '@nestjs/common';
import { ChatResolver } from './chat.resolver';
import { ChatRepository } from './chat.repository';
import { PubSub } from 'graphql-subscriptions';
import { GuardModule } from 'src/shared/guards/guard.module';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { SupabaseModule } from 'src/shared/modules/supabase.module';

@Module({
    imports: [GuardModule, SupabaseModule],
    providers: [
        ChatResolver,
        ChatRepository,
        {
            provide: 'PUB_SUB',
            useValue: new PubSub(),
        }, JwtAuthGuard
    ],
})
export class ChatModule { } 