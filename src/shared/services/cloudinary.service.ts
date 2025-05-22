import { Injectable, Logger } from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryResponse } from '../interfaces/cloudinary.interface'
import * as streamifier from 'streamifier'

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name)

  async uploadImage(file: Express.Multer.File, userId: string, folder = 'blog-covers'): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${folder}/${userId}`,
          resource_type: 'auto',
          format: 'webp',
          transformation: [{ width: 1200, height: 630, crop: 'limit' }, { quality: 'auto:good' }],
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Upload failed: ${error.message}`, error)
            return reject(new Error(error instanceof Error ? error.message : JSON.stringify(error)))
          }
          resolve(result)
        },
      )

      streamifier.createReadStream(file.buffer).pipe(uploadStream)
    })
  }

  async deleteImage(publicId: string): Promise<any> {
    try {
      return await cloudinary.uploader.destroy(publicId)
    } catch (error) {
      this.logger.error(`Failed to delete image: ${error.message}`, error)
      throw error
    }
  }
}