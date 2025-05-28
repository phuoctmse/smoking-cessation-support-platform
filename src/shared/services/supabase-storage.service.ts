import { Inject, Injectable, Logger } from '@nestjs/common'
import { SupabaseClient } from '@supabase/supabase-js'
import envConfig from '../config/config'

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name)
  private readonly bucketName: string

  constructor(@Inject('SUPABASE') private supabase: SupabaseClient) {
    this.bucketName = envConfig.SUPABASE_BUCKET || 'images'
    this.initBucket()
  }

  async uploadImage(
    file: Express.Multer.File,
    userId: string,
    folder = 'blog-covers',
  ): Promise<{ url: string; path: string }> {
    try {
      const fileExt = file.originalname.split('.').pop()
      const filePath = `${folder}/${userId}/${Date.now()}.${fileExt}`

      // Use the main supabase client (service role) for uploads
      const { data, error } = await this.supabase.storage.from(this.bucketName).upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      })

      if (error) {
        this.logger.error(`Upload failed: ${error.message}`, error)
        throw error
      }

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = this.supabase.storage.from(this.bucketName).getPublicUrl(filePath)

      return {
        url: publicUrlData.publicUrl,
        path: filePath,
      }
    } catch (error) {
      this.logger.error(`Failed to upload image: ${error.message}`)
      throw error
    }
  }

  async deleteImage(filePath: string): Promise<void> {
    try {
      // Use service role for delete operations
      const { error } = await this.supabase.storage.from(this.bucketName).remove([filePath])

      if (error) {
        this.logger.error(`Failed to delete image: ${error.message}`)
        throw error
      }

      this.logger.log(`Successfully deleted image: ${filePath}`)
    } catch (error) {
      this.logger.error(`Failed to delete image: ${error.message}`)
      throw error
    }
  }

  private async initBucket() {
    try {
      // Check if the bucket exists using service role
      const { data, error } = await this.supabase.storage.getBucket(this.bucketName)

      if (error) {
        if (error.message.includes('does not exist')) {
          const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
            public: true,
            fileSizeLimit: 10485760, // 10MB in bytes
          })

          if (createError) {
            this.logger.error(`Failed to create bucket: ${createError.message}`)
          } else {
            this.logger.log(`Bucket ${this.bucketName} created successfully`)
          }
        } else {
          this.logger.error(`Error checking bucket: ${error.message}`)
        }
      }
    } catch (error) {
      this.logger.error(`Failed during bucket initialization: ${error.message}`)
    }
  }
}