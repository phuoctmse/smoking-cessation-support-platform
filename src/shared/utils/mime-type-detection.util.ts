import { Logger } from '@nestjs/common';

const logger = new Logger('MimeTypeDetection');

/**
 * Map of file signatures (magic bytes) to MIME types
 */
const FILE_SIGNATURES = {
  // JPEG signatures
  'ffd8ffe0': 'image/jpeg',
  'ffd8ffe1': 'image/jpeg',
  'ffd8ffe2': 'image/jpeg',
  'ffd8ffe3': 'image/jpeg',
  'ffd8ffe8': 'image/jpeg',
  // PNG signature
  '89504e47': 'image/png',
  // WebP signatures
  '52494646': 'image/webp', // RIFF header, will check for WEBP
};

/**
 * More lenient MIME type mapping
 */
const MIME_TYPE_ALIASES: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/x-png': 'image/png',
};

/**
 * Detects file type from buffer using magic bytes
 */
export function detectMimeTypeFromBuffer(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // Get first 4 bytes as hex
  const hex = buffer.slice(0, 4).toString('hex').toLowerCase();

  const mimeType = FILE_SIGNATURES[hex];

  // Special case for WebP - check for "WEBP" string at offset 8
  if (hex === '52494646' && buffer.length >= 12) { // RIFF header
    const webpCheck = buffer.slice(8, 12).toString('ascii');
    if (webpCheck === 'WEBP') {
      return 'image/webp';
    }
    return null;
  }

  return mimeType || null;
}

/**
 * Normalizes and validates MIME types, including aliases
 */
export function normalizeMimeType(mimeType: string): string {
  // Convert to lowercase
  const lowerMimeType = mimeType.toLowerCase();

  // Check for aliases
  return MIME_TYPE_ALIASES[lowerMimeType] || lowerMimeType;
}

/**
 * Check if file MIME type is allowed, with better validation
 */
export function validateAndNormalizeMimeType(
  mimeType: string | undefined,
  buffer: Buffer,
  allowedFormats: string[]
): { valid: boolean; normalizedMimeType: string | null } {

  // Start with the provided MIME type
  let normalizedMimeType = mimeType ? normalizeMimeType(mimeType) : null;

  // If no MIME type or invalid, try to detect from buffer
  if (!normalizedMimeType || !allowedFormats.includes(normalizedMimeType)) {
    const detectedType = detectMimeTypeFromBuffer(buffer);

    if (detectedType) {
      normalizedMimeType = detectedType;
    }
  }

  // Check if the MIME type is in allowed formats
  const valid = normalizedMimeType !== null && allowedFormats.includes(normalizedMimeType);

  return { valid, normalizedMimeType };
}