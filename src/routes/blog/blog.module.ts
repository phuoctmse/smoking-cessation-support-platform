import { Module } from '@nestjs/common'
import { BlogService } from './blog.service'
import { BlogResolver } from './blog.resolver'
import { BlogRepository } from './blog.repository'
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'

@Module({
  imports: [GuardModule, SupabaseModule],
  providers: [BlogResolver, BlogService, BlogRepository],
  exports: [BlogService],
})
export class BlogModule {}
