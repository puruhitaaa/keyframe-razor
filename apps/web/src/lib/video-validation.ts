/**
 * Video File Validation Utility
 *
 * Provides comprehensive validation for video file formats, codecs,
 * and size limits with clear error messages.
 */

export interface VideoValidationResult {
  /** Whether the video file is valid */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Validation details */
  details?: {
    format: string;
    size: number;
    sizeFormatted: string;
    codec?: string;
    duration?: number;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

export interface VideoValidationOptions {
  /** Maximum file size in bytes (default: 500MB) */
  maxSize?: number;
  /** Allowed MIME types (default: common video formats) */
  allowedFormats?: string[];
  /** Allowed video codecs (optional, checks codecs if provided) */
  allowedCodecs?: string[];
  /** Minimum duration in seconds (optional) */
  minDuration?: number;
  /** Maximum duration in seconds (optional) */
  maxDuration?: number;
  /** Minimum width in pixels (optional) */
  minWidth?: number;
  /** Maximum width in pixels (optional) */
  maxWidth?: number;
  /** Minimum height in pixels (optional) */
  minHeight?: number;
  /** Maximum height in pixels (optional) */
  maxHeight?: number;
}

/**
 * Default validation options
 */
const DEFAULT_OPTIONS: Required<Omit<VideoValidationOptions, 'allowedCodecs' | 'minDuration' | 'maxDuration' | 'minWidth' | 'maxWidth' | 'minHeight' | 'maxHeight'>> & {
  allowedCodecs?: string[];
  minDuration?: number;
  maxDuration?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
} = {
  maxSize: 500 * 1024 * 1024, // 500MB
  allowedFormats: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo', // AVI
    'video/x-matroska', // MKV
  ],
  allowedCodecs: undefined,
  minDuration: undefined,
  maxDuration: undefined,
  minWidth: undefined,
  maxWidth: undefined,
  minHeight: undefined,
  maxHeight: undefined,
};

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Extract video codec information from MIME type
 */
function extractCodecFromMimeType(mimeType: string): string | undefined {
  const match = mimeType.match(/codecs="([^"]+)"/);
  return match ? match[1] : undefined;
}

/**
 * Get detailed video information using HTMLVideoElement
 */
async function getVideoInfo(file: File): Promise<{
  duration?: number;
  width?: number;
  height?: number;
  codec?: string;
}> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
    };

    video.onloadedmetadata = () => {
      const info = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      };

      // Try to get codec information
      if (video.src) {
        const codec = extractCodecFromMimeType(file.type);
        if (codec) {
          info.codec = codec;
        }
      }

      cleanup();
      resolve(info);
    };

    video.onerror = () => {
      cleanup();
      // Return partial info if metadata loading fails
      resolve({
        codec: extractCodecFromMimeType(file.type),
      });
    };

    // Set a timeout in case metadata loading hangs
    const timeout = setTimeout(() => {
      cleanup();
      resolve({
        codec: extractCodecFromMimeType(file.type),
      });
    }, 5000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const info = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      };

      if (video.src) {
        const codec = extractCodecFromMimeType(file.type);
        if (codec) {
          info.codec = codec;
        }
      }

      cleanup();
      resolve(info);
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Validate a video file against the provided options
 *
 * @param file - The file to validate
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 */
export async function validateVideoFile(
  file: File,
  options: VideoValidationOptions = {}
): Promise<VideoValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file size
  if (file.size > opts.maxSize) {
    return {
      isValid: false,
      error: `File size (${formatBytes(file.size)}) exceeds maximum allowed size (${formatBytes(opts.maxSize)})`,
    };
  }

  // Check file format (MIME type)
  const isFormatValid = opts.allowedFormats.some(format => {
    // Handle both exact matches and wildcard patterns
    if (format.endsWith('/*')) {
      const baseType = format.slice(0, -2);
      return file.type.startsWith(baseType);
    }
    return file.type === format || file.type.startsWith(format + ';');
  });

  if (!isFormatValid) {
    const formats = opts.allowedFormats.map(f => f.split('/')[1]?.toUpperCase() || f).join(', ');
    return {
      isValid: false,
      error: `Unsupported video format: ${file.type || 'unknown'}. Supported formats: ${formats}`,
    };
  }

  // Get detailed video information
  const videoInfo = await getVideoInfo(file);

  // Check duration if specified
  if (opts.minDuration !== undefined && videoInfo.duration !== undefined) {
    if (videoInfo.duration < opts.minDuration) {
      return {
        isValid: false,
        error: `Video duration (${Math.round(videoInfo.duration)}s) is less than minimum required (${opts.minDuration}s)`,
      };
    }
  }

  if (opts.maxDuration !== undefined && videoInfo.duration !== undefined) {
    if (videoInfo.duration > opts.maxDuration) {
      return {
        isValid: false,
        error: `Video duration (${Math.round(videoInfo.duration)}s) exceeds maximum allowed (${opts.maxDuration}s)`,
      };
    }
  }

  // Check dimensions if specified
  if (videoInfo.width && videoInfo.height) {
    if (opts.minWidth !== undefined && videoInfo.width < opts.minWidth) {
      return {
        isValid: false,
        error: `Video width (${videoInfo.width}px) is less than minimum required (${opts.minWidth}px)`,
      };
    }

    if (opts.maxWidth !== undefined && videoInfo.width > opts.maxWidth) {
      return {
        isValid: false,
        error: `Video width (${videoInfo.width}px) exceeds maximum allowed (${opts.maxWidth}px)`,
      };
    }

    if (opts.minHeight !== undefined && videoInfo.height < opts.minHeight) {
      return {
        isValid: false,
        error: `Video height (${videoInfo.height}px) is less than minimum required (${opts.minHeight}px)`,
      };
    }

    if (opts.maxHeight !== undefined && videoInfo.height > opts.maxHeight) {
      return {
        isValid: false,
        error: `Video height (${videoInfo.height}px) exceeds maximum allowed (${opts.maxHeight}px)`,
      };
    }
  }

  // Check codec if specified
  if (opts.allowedCodecs && opts.allowedCodecs.length > 0) {
    if (videoInfo.codec) {
      const codecValid = opts.allowedCodecs.some(codec =>
        videoInfo.codec?.toLowerCase().includes(codec.toLowerCase())
      );

      if (!codecValid) {
        return {
          isValid: false,
          error: `Unsupported video codec: ${videoInfo.codec}. Supported codecs: ${opts.allowedCodecs.join(', ')}`,
        };
      }
    }
  }

  // All validations passed
  return {
    isValid: true,
    details: {
      format: file.type,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
      codec: videoInfo.codec,
      duration: videoInfo.duration,
      dimensions: videoInfo.width && videoInfo.height
        ? { width: videoInfo.width, height: videoInfo.height }
        : undefined,
    },
  };
}

/**
 * Quick validation without loading video metadata
 * Useful for immediate format and size checks
 *
 * @param file - The file to validate
 * @param options - Validation options (only uses maxSize and allowedFormats)
 * @returns Validation result with error message if invalid
 */
export function validateVideoFileQuick(
  file: File,
  options: VideoValidationOptions = {}
): VideoValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file size
  if (file.size > opts.maxSize) {
    return {
      isValid: false,
      error: `File size (${formatBytes(file.size)}) exceeds maximum allowed size (${formatBytes(opts.maxSize)})`,
    };
  }

  // Check file format (MIME type)
  const isFormatValid = opts.allowedFormats.some(format => {
    if (format.endsWith('/*')) {
      const baseType = format.slice(0, -2);
      return file.type.startsWith(baseType);
    }
    return file.type === format || file.type.startsWith(format + ';');
  });

  if (!isFormatValid) {
    const formats = opts.allowedFormats.map(f => f.split('/')[1]?.toUpperCase() || f).join(', ');
    return {
      isValid: false,
      error: `Unsupported video format: ${file.type || 'unknown'}. Supported formats: ${formats}`,
    };
  }

  // Basic validation passed
  return {
    isValid: true,
    details: {
      format: file.type,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
    },
  };
}

/**
 * Check if a file is a video file
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Get common video MIME types
 */
export const VIDEO_FORMATS = {
  MP4: 'video/mp4',
  WEBM: 'video/webm',
  OGG: 'video/ogg',
  QUICKTIME: 'video/quicktime',
  AVI: 'video/x-msvideo',
  MKV: 'video/x-matroska',
  MOV: 'video/quicktime',
} as const;

/**
 * Get common video codecs
 */
export const VIDEO_CODECS = {
  H264: 'avc1',
  H265: 'hev1',
  VP8: 'vp8',
  VP9: 'vp9',
  AV1: 'av01',
  THEORA: 'theora',
} as const;
