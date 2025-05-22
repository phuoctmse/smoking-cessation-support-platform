import { Module } from '@nestjs/common'
import { CloudinaryConfigProvider } from '../config/cloudinary.config'
import { CloudinaryService } from '../services/cloudinary.service'

@Module({
  providers: [CloudinaryConfigProvider, CloudinaryService],
  exports: [CloudinaryConfigProvider, CloudinaryService],
})
export class CloudinaryModule {}