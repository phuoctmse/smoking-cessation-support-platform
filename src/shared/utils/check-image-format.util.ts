import { ALLOWED_IMAGE_FORMATS } from '../constants/upload.constant'

export function isAllowedImageFormat(mimetype: string): boolean {
  return ALLOWED_IMAGE_FORMATS.includes(mimetype);
}