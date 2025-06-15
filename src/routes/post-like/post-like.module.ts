import { forwardRef, Module } from '@nestjs/common'
import { PostLikeService } from './post-like.service';
import { PostLikeResolver } from './post-like.resolver';
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { SharedPostModule } from '../shared-post/shared-post.module'
import { PostLikeRepository } from './post-like.repository'

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    forwardRef(() => SharedPostModule),
  ],
  providers: [PostLikeResolver, PostLikeService, PostLikeRepository],
  exports: [PostLikeService, PostLikeRepository],
})
export class PostLikeModule {}
