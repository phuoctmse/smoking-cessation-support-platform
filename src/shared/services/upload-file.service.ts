import { Injectable, Logger, UnsupportedMediaTypeException } from '@nestjs/common'
import { SupabaseStorageService } from './supabase-storage.service'
import { FileUpload } from 'graphql-upload/processRequest.mjs'
import { ALLOWED_IMAGE_FORMATS, FILE_FORMAT_EXTENSIONS } from '../constants/upload.constant'
import { processUploadedFile } from '../utils/file-upload.util'
import { validateAndNormalizeMimeType } from '../utils/mime-type-detection.util'

export interface UploadResult {
  url: string | null;
  path: string | null;
}

export interface UploadOptions {
  folder?: string;
  allowedFormats?: string[];
  maxSize?: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly supabaseStorage: SupabaseStorageService) {}

  /**
   * Handle image upload with validation
   */
  async handleImageUpload(
    fileUpload: Promise<FileUpload> | null | undefined,
    userId: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    if (!fileUpload) {
      return { url: null, path: null };
    }

    const {
      folder = 'uploads',
      allowedFormats = ALLOWED_IMAGE_FORMATS,
      maxSize = 10 * 1024 * 1024, // 10MB
    } = options;

    try {
      const { buffer, filename, mimetype } = await processUploadedFile(fileUpload);

      // Validate file size
      if (buffer.length > maxSize) {
        throw new UnsupportedMediaTypeException(
          `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
        );
      }

      // Validate MIME type
      const { valid, normalizedMimeType } = validateAndNormalizeMimeType(
        mimetype,
        buffer,
        allowedFormats,
      );

      if (!valid || !normalizedMimeType) {
        throw new UnsupportedMediaTypeException(
          `Invalid file format. Allowed formats: ${allowedFormats.join(', ')}`,
        );
      }

      const extension = FILE_FORMAT_EXTENSIONS[normalizedMimeType];
      const uploadResult = await this.supabaseStorage.uploadImage(
        {
          buffer,
          originalname: `${filename || 'upload'}${extension}`,
          mimetype: normalizedMimeType,
          size: buffer.length,
        } as Express.Multer.File,
        userId,
        folder,
      );

      this.logger.log(`Successfully uploaded image: ${uploadResult.url}`);
      return { url: uploadResult.url, path: uploadResult.path };
    } catch (error) {
      if (error instanceof UnsupportedMediaTypeException) {
        throw error;
      }

      this.logger.error(`Failed to upload image: ${error.message}`, error.stack);
      // Return null values instead of throwing, let the calling method decide
      return { url: null, path: null };
    }
  }

  /**
   * Safely delete image
   */
  async deleteImageSafely(imagePath: string): Promise<void> {
    try {
      await this.supabaseStorage.deleteImage(imagePath);
      this.logger.log(`Successfully deleted image: ${imagePath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete image ${imagePath}: ${error.message}`);
      // Don't throw error for image deletion failures as it's not critical
    }
  }

  /**
   * Replace existing image with new upload
   */
  async replaceImage(
    fileUpload: Promise<FileUpload> | null | undefined,
    userId: string,
    currentImagePath: string | null,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    if (!fileUpload) {
      return { url: null, path: currentImagePath };
    }

    // Upload new image
    const uploadResult = await this.handleImageUpload(fileUpload, userId, options);

    // Delete old image if new upload was successful and old image exists
    if (uploadResult.url && currentImagePath) {
      await this.deleteImageSafely(currentImagePath);
    }

    return uploadResult;
  }

  /**
   * Handle multiple image uploads
   */
  async handleMultipleImageUploads(
    fileUploads: (Promise<FileUpload> | null | undefined)[],
    userId: string,
    options: UploadOptions = {},
  ): Promise<UploadResult[]> {
    const results = await Promise.allSettled(
      fileUploads.map(fileUpload => this.handleImageUpload(fileUpload, userId, options))
    );

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        this.logger.error(`Failed to upload image: ${result.reason.message}`);
        return { url: null, path: null };
      }
    });
  }
}