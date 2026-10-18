import multer from 'multer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
]);

/**
 * Inspect magic bytes of the in-memory buffer.
 * Returns detected mime type or null if unsupported.
 */
export function detectMagicBytes(buffer) {
  if (!buffer || buffer.length < 4) return null;

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PDF: %PDF (0x25 0x50 0x44 0x46)
  if (buffer.slice(0, 4).toString('utf-8') === '%PDF') {
    return 'application/pdf';
  }

  return null;
}

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      const err = new Error('Invalid file type. Supported formats are PNG, JPEG, and PDF.');
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
}).single('file');

/**
 * Wrapped upload middleware to guarantee correct HTTP status codes:
 * - LIMIT_FILE_SIZE -> 413
 * - Invalid file type / unexpected fields -> 400
 * - Magic bytes verification -> 400 if mismatched
 */
export function documentUpload(req, res, next) {
  multerUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          err.statusCode = 413;
          err.message = 'File exceeds the 10 MB size limit.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          err.statusCode = 400;
          err.message = 'Unexpected file field. Field name must be "file".';
        } else {
          err.statusCode = 400;
        }
      } else if (!err.statusCode) {
        err.statusCode = 400;
      }
      return next(err);
    }

    if (!req.file) {
      const error = new Error('A document file (PNG, JPEG, or PDF) is required.');
      error.statusCode = 400;
      return next(error);
    }

    const detectedType = detectMagicBytes(req.file.buffer);
    if (!detectedType) {
      const error = new Error('Invalid file content. File does not match supported PNG, JPEG, or PDF format.');
      error.statusCode = 400;
      return next(error);
    }

    req.file.detectedMimeType = detectedType;
    next();
  });
}

export default documentUpload;
