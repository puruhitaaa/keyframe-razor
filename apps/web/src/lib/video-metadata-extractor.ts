/**
 * Video Metadata Extractor
 *
 * Extracts comprehensive metadata from video files using HTML5 video element APIs.
 * Provides duration, dimensions, codec information, and audio track details.
 */

export interface VideoMetadata {
  /** Video duration in seconds */
  duration: number;
  /** Video width in pixels */
  width: number;
  /** Video height in pixels */
  height: number;
  /** Video aspect ratio (width / height) */
  aspectRatio: number;
  /** Video file size in bytes */
  fileSize: number;
  /** Formatted file size string */
  fileSizeFormatted: string;
  /** Video MIME type */
  mimeType: string;
  /** Video codec information */
  codec?: string;
  /** Audio track information */
  audioTracks?: AudioTrackInfo[];
  /** Whether the video has audio */
  hasAudio: boolean;
  /** Video frame rate (if available) */
  frameRate?: number;
  /** Video bitrate estimate (if available) */
  bitrate?: number;
  /** Raw MIME type with codecs */
  rawMimeType?: string;
}

export interface AudioTrackInfo {
  /** Track ID */
  id: string;
  /** Track label */
  label: string;
  /** Track language */
  language: string;
  /** Track kind (e.g., 'main', 'alternative', 'commentary') */
  kind: string;
  /** Whether the track is enabled */
  enabled: boolean;
}

export interface MetadataExtractionOptions {
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Whether to extract audio track information (default: true) */
  extractAudioTracks?: boolean;
  /** Whether to attempt bitrate calculation (default: true) */
  calculateBitrate?: boolean;
}

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
 * Extract codec information from MIME type
 */
function extractCodecFromMimeType(mimeType: string): string | undefined {
  const match = mimeType.match(/codecs="([^"]+)"/);
  return match ? match[1] : undefined;
}

/**
 * Parse codecs string to get video and audio codecs
 */
function parseCodecs(codecString?: string): { video?: string; audio?: string } {
  if (!codecString) return {};

  const codecs = codecString.split(',').map(c => c.trim());
  const result: { video?: string; audio?: string } = {};

  // Common video codec patterns
  const videoCodecs = ['avc1', 'avc3', 'hev1', 'hvc1', 'vp8', 'vp9', 'av01', 'theora'];
  // Common audio codec patterns
  const audioCodecs = ['mp4a', 'aac', 'opus', 'vorbis', 'ec-3', 'ac-3'];

  for (const codec of codecs) {
    const lowerCodec = codec.toLowerCase();
    if (videoCodecs.some(vc => lowerCodec.startsWith(vc))) {
      result.video = codec;
    } else if (audioCodecs.some(ac => lowerCodec.startsWith(ac))) {
      result.audio = codec;
    }
  }

  return result;
}

/**
 * Estimate bitrate from file size and duration
 */
function calculateBitrate(fileSize: number, duration: number): number {
  if (duration === 0) return 0;
  // Return bitrate in kilobits per second (Kbps)
  return Math.round((fileSize * 8) / (duration * 1000));
}

/**
 * Extract audio track information from video element
 */
function extractAudioTracks(video: HTMLVideoElement): AudioTrackInfo[] {
  const tracks: AudioTrackInfo[] = [];

  // Check if video has audio tracks (HTMLMediaElement API)
  if (video.audioTracks) {
    for (let i = 0; i < video.audioTracks.length; i++) {
      const track = video.audioTracks[i];
      tracks.push({
        id: track.id,
        label: track.label || `Audio Track ${i + 1}`,
        language: track.language || 'unknown',
        kind: track.kind || 'main',
        enabled: track.enabled,
      });
    }
  }

  return tracks;
}

/**
 * Extract comprehensive metadata from a video file
 *
 * @param file - The video file to extract metadata from
 * @param options - Extraction options
 * @returns Promise resolving to video metadata
 */
export async function extractVideoMetadata(
  file: File,
  options: MetadataExtractionOptions = {}
): Promise<VideoMetadata> {
  const {
    timeout = 10000,
    extractAudioTracks = true,
    calculateBitrate: shouldCalculateBitrate = true,
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    let timeoutId: NodeJS.Timeout;

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const handleLoadedMetadata = () => {
      // Extract basic metadata
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      const aspectRatio = width > 0 && height > 0 ? width / height : 0;

      // Extract codec information
      const rawMimeType = file.type;
      const codecString = extractCodecFromMimeType(rawMimeType);
      const parsedCodecs = parseCodecs(codecString);

      // Extract audio tracks if requested
      let audioTracks: AudioTrackInfo[] = [];
      let hasAudio = false;

      if (extractAudioTracks) {
        try {
          audioTracks = extractAudioTracks(video);
          hasAudio = audioTracks.length > 0;

          // If audioTracks API is not supported, check for audio codec
          if (!hasAudio && parsedCodecs.audio) {
            hasAudio = true;
            audioTracks = [{
              id: 'default',
              label: 'Default Audio',
              language: 'unknown',
              kind: 'main',
              enabled: true,
            }];
          }
        } catch (error) {
          // Audio tracks API might not be supported in this browser
          // Fall back to checking for audio codec
          if (parsedCodecs.audio) {
            hasAudio = true;
            audioTracks = [{
              id: 'default',
              label: 'Default Audio',
              language: 'unknown',
              kind: 'main',
              enabled: true,
            }];
          }
        }
      } else {
        hasAudio = !!parsedCodecs.audio;
      }

      // Calculate bitrate if requested
      let bitrate: number | undefined;
      if (shouldCalculateBitrate && duration > 0) {
        bitrate = calculateBitrate(file.size, duration);
      }

      const metadata: VideoMetadata = {
        duration,
        width,
        height,
        aspectRatio,
        fileSize: file.size,
        fileSizeFormatted: formatBytes(file.size),
        mimeType: file.type,
        codec: parsedCodecs.video || codecString,
        audioTracks,
        hasAudio,
        bitrate,
        rawMimeType,
      };

      cleanup();
      resolve(metadata);
    };

    // Set up event listeners
    video.onloadedmetadata = handleLoadedMetadata;
    video.onerror = () => handleError(new Error('Failed to load video metadata'));

    // Set timeout
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Metadata extraction timeout after ${timeout}ms`));
    }, timeout);

    // Load the video
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Extract metadata from a video URL
 *
 * @param url - The URL of the video
 * @param options - Extraction options
 * @returns Promise resolving to video metadata (excluding file size)
 */
export async function extractVideoMetadataFromUrl(
  url: string,
  options: MetadataExtractionOptions = {}
): Promise<Omit<VideoMetadata, 'fileSize' | 'fileSizeFormatted'>> {
  const {
    timeout = 10000,
    extractAudioTracks = true,
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    let timeoutId: NodeJS.Timeout;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      video.src = '';
      video.load();
    };

    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const handleLoadedMetadata = () => {
      // Extract basic metadata
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      const aspectRatio = width > 0 && height > 0 ? width / height : 0;

      // Try to get MIME type from resource hints or headers
      // Note: This is a limitation - we can't easily get the MIME type from a URL
      const mimeType = 'video/mp4'; // Default assumption

      // Extract codec information (if available from canPlayType)
      let codec: string | undefined;
      if (video.canPlayType) {
        // This is a best-effort attempt
        const support = video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
        if (support !== '') {
          codec = 'avc1'; // Generic H.264
        }
      }

      // Extract audio tracks if requested
      let audioTracks: AudioTrackInfo[] = [];
      let hasAudio = false;

      if (extractAudioTracks) {
        try {
          audioTracks = extractAudioTracks(video);
          hasAudio = audioTracks.length > 0;
        } catch (error) {
          // Audio tracks API might not be supported
          hasAudio = true; // Assume yes for most online videos
        }
      }

      const metadata: Omit<VideoMetadata, 'fileSize' | 'fileSizeFormatted'> = {
        duration,
        width,
        height,
        aspectRatio,
        fileSize: 0,
        fileSizeFormatted: 'Unknown',
        mimeType,
        codec,
        audioTracks,
        hasAudio,
        rawMimeType: mimeType,
      };

      cleanup();
      resolve(metadata);
    };

    // Set up event listeners
    video.onloadedmetadata = handleLoadedMetadata;
    video.onerror = () => handleError(new Error('Failed to load video metadata'));

    // Set timeout
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Metadata extraction timeout after ${timeout}ms`));
    }, timeout);

    // Load the video
    video.src = url;
  });
}

/**
 * Quick metadata extraction without loading the entire video
 * Returns basic information available from the file itself
 *
 * @param file - The video file
 * @returns Basic metadata available without loading video
 */
export function getBasicVideoMetadata(file: File): Partial<VideoMetadata> {
  const codecString = extractCodecFromMimeType(file.type);
  const parsedCodecs = parseCodecs(codecString);

  return {
    fileSize: file.size,
    fileSizeFormatted: formatBytes(file.size),
    mimeType: file.type,
    codec: parsedCodecs.video || codecString,
    hasAudio: !!parsedCodecs.audio,
    rawMimeType: file.type,
  };
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format dimensions to readable string
 */
export function formatDimensions(width: number, height: number): string {
  return `${width}x${height}`;
}

/**
 * Format aspect ratio to common values
 */
export function formatAspectRatio(ratio: number): string {
  const commonRatios: Record<number, string> = {
    1.777: '16:9',
    1.333: '4:3',
    2.35: '2.35:1',
    2.39: '2.39:1',
    1.0: '1:1',
    0.5625: '9:16',
  };

  // Check for common ratios with small tolerance
  for (const [key, value] of Object.entries(commonRatios)) {
    if (Math.abs(ratio - parseFloat(key)) < 0.05) {
      return value;
    }
  }

  // Return simplified ratio
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const divisor = gcd(Math.round(ratio * 100), 100);
  const widthRatio = Math.round(ratio * 100 / divisor);
  const heightRatio = Math.round(100 / divisor);

  return `${widthRatio}:${heightRatio}`;
}

/**
 * Format bitrate to readable string
 */
export function formatBitrate(bitrate: number): string {
  if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(1)} Mbps`;
  }
  return `${bitrate} Kbps`;
}
