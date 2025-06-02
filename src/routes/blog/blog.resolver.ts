import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { BlogService } from './blog.service'
import { Blog } from './entities/blog.entity'
import { CreateBlogInput } from './dto/requests/create-blog.input'
import { UpdateBlogInput } from './dto/requests/update-blog.input'
import { PaginatedBlogsResponse } from './dto/responses/paginated-blog.response'
import { UserType } from '../../shared/models/share-user.model'
import { UseGuards } from '@nestjs/common'
import { Roles } from '../../shared/decorators/roles.decorator'
import { RoleName } from '../../shared/constants/role.constant'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'
import { User } from '../../shared/decorators/current-user.decorator'
import { FileUpload } from 'graphql-upload/processRequest.mjs'
import { UploadScalar } from '../../shared/scalars/upload.scalar'
import { PaginationParamsInput } from '../../shared/models/dto/request/pagination-params.input'
import { RolesGuard } from '../../shared/guards/roles.guard'

@Resolver(() => Blog)
export class BlogResolver {
  constructor(private readonly blogService: BlogService) {}

  @Query(() => PaginatedBlogsResponse)
  async blogs(@Args('params', { nullable: true }) params?: PaginationParamsInput) {
    return this.blogService.findAll(
      params || {
        page: 1,
        limit: 10,
        orderBy: 'created_at',
        sortOrder: 'desc',
      },
    )
  }

  @Query(() => Blog)
  async blog(@Args('id') id: string) {
    return this.blogService.findOne(id)
  }

  @Query(() => Blog)
  async blogBySlug(@Args('slug') slug: string) {
    return this.blogService.findBySlug(slug)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach)
  @Mutation(() => Blog)
  async createBlog(
    @Args('input') input: CreateBlogInput,
    @Args({ name: 'coverImage', type: () => UploadScalar, nullable: true }) coverImage: Promise<FileUpload>,
    @User() user: UserType,
  ) {
    return this.blogService.create(input, coverImage, user.id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach)
  @Mutation(() => Blog)
  async updateBlog(
    @Args('input') input: UpdateBlogInput,
    @Args({ name: 'coverImage', type: () => UploadScalar, nullable: true }) coverImage: Promise<FileUpload>,
    @User() user: UserType,
  ) {
    const { id, ...updateData } = input
    return this.blogService.update(id, updateData, coverImage, user.id, user.role)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach, RoleName.Admin)
  @Mutation(() => Blog)
  async removeBlog(@Args('id') id: string, @User() user: UserType) {
    return this.blogService.remove(id, user.id, user.role)
  }
}