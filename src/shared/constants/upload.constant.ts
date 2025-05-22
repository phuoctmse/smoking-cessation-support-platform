/**
 * List of allowed MIME types for image uploads
 */
export const ALLOWED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

/**
 * Mapping of MIME types to file extensions
 */
export const FILE_FORMAT_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

/**
 * Maximum file size for uploads in bytes
 * 10MB = 10 * 1024 * 1024
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;