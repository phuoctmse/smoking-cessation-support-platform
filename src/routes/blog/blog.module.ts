import { Module } from '@nestjs/common'
import { BlogService } from './blog.service'
import { BlogResolver } from './blog.resolver'
import { BlogRepository } from './blog.repository'
import { GuardModule } from '../../shared/guards/guard.module'
import { CloudinaryModule } from '../../shared/modules/cloudinary.module'

@Module({
  imports: [GuardModule, CloudinaryModule],
  providers: [BlogResolver, BlogService, BlogRepository],
  exports: [BlogService],
})
export class BlogModule {}
