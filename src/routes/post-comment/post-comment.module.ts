import { forwardRef, Module } from '@nestjs/common'
import { PostCommentService } from './post-comment.service';
import { PostCommentResolver } from './post-comment.resolver';
import { SharedPostModule } from '../shared-post/shared-post.module'
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { PostCommentRepository } from './post-comment.repository'

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    forwardRef(() => SharedPostModule),
  ],
  providers: [PostCommentResolver, PostCommentService, PostCommentRepository],
  exports: [PostCommentService, PostCommentRepository],
})
export class PostCommentModule {}