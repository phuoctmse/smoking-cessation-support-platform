import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { BlogRepository } from './blog.repository'
import { RoleName } from '../../shared/constants/role.constant'
import { FileUpload } from 'graphql-upload/processRequest.mjs'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { CreateBlogType } from './schema/create-blog.schema'
import { UpdateBlogType } from './schema/update-blog.schema'
import { UploadService } from '../../shared/services/upload-file.service'

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name)

  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly uploadService: UploadService,
  ) {}

  async findAll(params: PaginationParamsType) {
    return this.blogRepository.findAll(params)
  }

  async findOne(id: string) {
    const blog = await this.blogRepository.findOne(id)

    if (!blog || blog.is_deleted) {
      throw new NotFoundException('Blog not found')
    }

    return blog
  }

  async findBySlug(slug: string) {
    const blog = await this.blogRepository.findBySlug(slug)

    if (!blog || blog.is_deleted) {
      throw new NotFoundException('Blog not found')
    }

    return blog
  }

  async create(data: CreateBlogType, fileUpload: Promise<FileUpload> | null | undefined, userId: string) {
    const { url: coverImageUrl, path: coverImagePath } = await this.uploadService.handleImageUpload(
      fileUpload,
      userId,
      { folder: 'blog-covers' },
    )

    const blogData = {
      ...data,
      cover_image: coverImageUrl,
      cover_image_path: coverImagePath,
    }

    const blog = await this.blogRepository.create(blogData, userId)
    this.logger.log(`Blog created: ${blog.id}`)
    return blog
  }

  async update(
    id: string,
    data: UpdateBlogType,
    fileUpload: Promise<FileUpload> | null | undefined,
    userId: string,
    userRole: string,
  ) {
    const blog = await this.findOne(id)
    this.validateUpdatePermission(blog, userId, userRole)

    const { url: coverImageUrl, path: coverImagePath } = await this.uploadService.replaceImage(
      fileUpload,
      userId,
      blog.cover_image_path,
      { folder: 'blog-covers' },
    )

    const blogData = {
      ...data,
      cover_image: coverImageUrl || data.cover_image,
      cover_image_path: coverImagePath,
    }

    const updatedBlog = await this.blogRepository.update(id, blogData)
    this.logger.log(`Blog updated: ${updatedBlog.id}`)
    return updatedBlog
  }

  async remove(id: string, userId: string, userRole: string) {
    const blog = await this.findOne(id)
    this.validateDeletePermission(blog, userId, userRole)

    if (blog.cover_image_path) {
      await this.uploadService.deleteImageSafely(blog.cover_image_path)
    }

    const deletedBlog = await this.blogRepository.delete(id)
    this.logger.log(`Blog deleted: ${deletedBlog.id}`)
    return deletedBlog
  }

  private validateUpdatePermission(blog: any, userId: string, userRole: string): void {
    if (blog.author_id !== userId && userRole !== RoleName.Coach) {
      throw new ForbiddenException('You do not have permission to update this blog')
    }
  }

  private validateDeletePermission(blog: any, userId: string, userRole: string): void {
    const canDelete = blog.author_id === userId || userRole === RoleName.Coach || userRole === RoleName.Admin

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this blog')
    }
  }
}
