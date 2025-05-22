import { Readable } from 'stream';
import { streamToBuffer } from './stream.util';
import { Logger } from '@nestjs/common';

const logger = new Logger('FileUploadUtil');

/**
 * Processes an uploaded file from various possible formats
 * @param filePromise Promise<FileUpload> or file-like object
 * @returns Object with buffer, filename and mimetype
 */
export async function processUploadedFile(filePromise: any): Promise<{
  buffer: Buffer;
  filename: string;
  mimetype: string;
}> {
  if (!filePromise) {
    throw new Error('No file provided');
  }

  // First, resolve the file promise if it is one
  const file = filePromise instanceof Promise ? await filePromise : filePromise;

  let buffer: Buffer;
  let filename = 'upload';
  let mimetype = 'application/octet-stream';

  // Try to extract filename and mimetype if available
  if (file.filename) filename = file.filename;
  if (file.mimetype) mimetype = file.mimetype;
  if (file.originalname) filename = file.originalname;

  // Handle different file upload formats
  if (typeof file.createReadStream === 'function') {
    // Standard GraphQL Upload file object
    const stream = file.createReadStream();
    buffer = await streamToBuffer(stream);
  } else if (file.buffer instanceof Buffer) {
    // Express Multer style file object
    buffer = file.buffer;
  } else if (file.stream) {
    // Stream-based file object
    buffer = await streamToBuffer(file.stream);
  } else if (Buffer.isBuffer(file)) {
    // Direct buffer
    buffer = file;
  } else if (file instanceof Readable) {
    // Readable stream
    buffer = await streamToBuffer(file);
  } else if (typeof file === 'object') {
    if (file.file) {
      // Nested file structure
      return processUploadedFile(file.file);
    }

    if (file.base64 || file.fileContents) {
      const base64Data = file.base64 || file.fileContents;
      buffer = Buffer.from(base64Data, 'base64');
      if (file.name) filename = file.name;
      if (file.type) mimetype = file.type;
    } else {
      throw new Error('Unsupported file object format');
    }
  } else {
    if (typeof file === 'string') {
      // Might be a file path or base64 string
      if (file.startsWith('data:')) {
        // Data URL
        const matches = file.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimetype = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          throw new Error('Invalid data URL format');
        }
      } else {
        try {
          const fs = require('fs');
          buffer = fs.readFileSync(file);
        } catch (err) {
          throw new Error('Could not process file from string');
        }
      }
    } else {
      throw new Error('Unsupported file upload format');
    }
  }

  return { buffer, filename, mimetype };
}