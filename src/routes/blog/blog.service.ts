import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common'
import { BlogRepository } from './blog.repository'
import { CreateBlogType, UpdateBlogType } from './model/blog.model'
import { RoleName } from '../../shared/constants/role.constant'
import { FileUpload } from 'graphql-upload/processRequest.mjs'
import { ALLOWED_IMAGE_FORMATS, FILE_FORMAT_EXTENSIONS } from '../../shared/constants/upload.constant'
import { processUploadedFile } from '../../shared/utils/file-upload.util'
import { validateAndNormalizeMimeType } from '../../shared/utils/mime-type-detection.util'
import { SupabaseStorageService } from '../../shared/services/supabase-storage.service'
import { PaginationParamsType } from '../../shared/models/pagination.model'

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name)

  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  async findAll(params: PaginationParamsType) {
    return await this.blogRepository.findAll(params)
  }

  async findOne(id: string) {
    const blog = await this.blogRepository.findOne(id)

    if (!blog || blog.is_deleted) {
      throw new NotFoundException(`Blog not found`)
    }

    return blog
  }

  async findBySlug(slug: string) {
    const blog = await this.blogRepository.findBySlug(slug)

    if (!blog || blog.is_deleted) {
      throw new NotFoundException(`Blog not found`)
    }

    return blog
  }

  async create(
    data: CreateBlogType,
    fileUpload: Promise<FileUpload> | null | undefined,
    userId: string,
    userRole: string,
  ) {
    if (userRole !== RoleName.Coach) {
      throw new ForbiddenException('Only coaches can create blog posts')
    }

    let coverImageUrl = null
    let coverImagePath = null

    if (fileUpload !== null && fileUpload !== undefined) {
      try {
        // Process the uploaded file
        const { buffer, filename, mimetype } = await processUploadedFile(fileUpload)

        // Validate and normalize the MIME type
        const { valid, normalizedMimeType } = validateAndNormalizeMimeType(mimetype, buffer, ALLOWED_IMAGE_FORMATS)

        if (!valid || !normalizedMimeType) {
          throw new UnsupportedMediaTypeException(
            `Invalid file format. Allowed formats: ${ALLOWED_IMAGE_FORMATS.join(', ')}`,
          )
        }

        // Get the extension for the file
        const extension = FILE_FORMAT_EXTENSIONS[normalizedMimeType]

        const uploadResult = await this.supabaseStorage.uploadImage(
          {
            buffer,
            originalname: `${filename || 'upload'}${extension}`,
            mimetype: normalizedMimeType,
            size: buffer.length,
          } as Express.Multer.File,
          userId,
        )

        coverImageUrl = uploadResult.url
        coverImagePath = uploadResult.path
        this.logger.log(`Successfully uploaded image: ${coverImageUrl}`)
      } catch (error) {
        if (error instanceof UnsupportedMediaTypeException) {
          throw error
        }
        this.logger.error(`Failed to upload image: ${error.message}`, error.stack)
      }
    }

    const blogData = {
      ...data,
      cover_image: coverImageUrl,
      cover_image_path: coverImagePath,
    }

    return this.blogRepository.create(blogData, userId)
  }

  async update(
    id: string,
    data: UpdateBlogType,
    fileUpload: Promise<FileUpload> | null | undefined,
    userId: string,
    userRole: string,
  ) {
    const blog = await this.blogRepository.findOne(id)

    if (!blog) {
      throw new NotFoundException(`Blog not found`)
    }

    if (blog.author_id !== userId && userRole !== RoleName.Coach) {
      throw new ForbiddenException('You do not have permission to update this blog')
    }

    let coverImageUrl = data.cover_image
    let coverImagePath = blog.cover_image_path

    if (fileUpload !== null && fileUpload !== undefined) {
      try {
        // Process the uploaded file
        const { buffer, filename, mimetype } = await processUploadedFile(fileUpload)

        // Validate and normalize the MIME type
        const { valid, normalizedMimeType } = validateAndNormalizeMimeType(mimetype, buffer, ALLOWED_IMAGE_FORMATS)

        if (!valid || !normalizedMimeType) {
          throw new UnsupportedMediaTypeException(
            `Invalid file format. Allowed formats: ${ALLOWED_IMAGE_FORMATS.join(', ')}`,
          )
        }

        // Get the extension for the file
        const extension = FILE_FORMAT_EXTENSIONS[normalizedMimeType]

        const uploadResult = await this.supabaseStorage.uploadImage(
          {
            buffer,
            originalname: `${filename || 'upload'}${extension}`,
            mimetype: normalizedMimeType,
            size: buffer.length,
          } as Express.Multer.File,
          userId,
        )

        coverImageUrl = uploadResult.url
        coverImagePath = uploadResult.path
        this.logger.log(`Successfully uploaded new image: ${coverImageUrl}`)

        // Delete old image if exists
        if (blog.cover_image_path) {
          await this.supabaseStorage.deleteImage(blog.cover_image_path)
          this.logger.log(`Successfully deleted old image: ${blog.cover_image_path}`)
        }
      } catch (error) {
        if (error instanceof UnsupportedMediaTypeException) {
          throw error
        }
        this.logger.error(`Failed to upload image: ${error.message}`, error.stack)
      }
    }

    const blogData = {
      ...data,
      cover_image: coverImageUrl,
      cover_image_path: coverImagePath,
    }

    return this.blogRepository.update(id, blogData)
  }

  async remove(id: string, userId: string, userRole: string) {
    const blog = await this.blogRepository.findOne(id)

    if (!blog) {
      throw new NotFoundException(`Blog not found`)
    }

    if (blog.author_id !== userId && userRole !== RoleName.Coach && userRole !== RoleName.Admin) {
      throw new ForbiddenException('You do not have permission to delete this blog')
    }

    if (blog.cover_image_path) {
      try {
        await this.supabaseStorage.deleteImage(blog.cover_image_path)
        this.logger.log(`Successfully deleted image for blog ${id}: ${blog.cover_image_path}`)
      } catch (error) {
        this.logger.warn(`Failed to delete image for blog ${id}: ${error.message}`)
      }
    }

    return await this.blogRepository.delete(id)
  }
}
