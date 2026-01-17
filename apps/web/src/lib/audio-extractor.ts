/**
 * Audio Extractor - Extract audio data from uploaded video files using Web Audio API
 *
 * This utility provides comprehensive audio data extraction from video files using the
 * Web Audio API's AudioContext. It can decode audio data for analysis and processing.
 *
 * Features:
 * - Decode audio data from video files
 * - Extract audio buffer information (duration, sample rate, channels)
 * - Convert audio to different formats (WAV, Float32Array)
 * - Analyze audio properties (peak levels, RMS, frequency data)
 * - Extract audio segments/clips
 * - Generate audio waveforms for visualization
 */

import { AudioContextManager, getAudioContextManager } from './audio-context-manager';

/**
 * Audio metadata extracted from a video file
 */
export interface AudioMetadata {
  /** Duration of the audio in seconds */
  duration: number;
  /** Sample rate in Hz (e.g., 44100, 48000) */
  sampleRate: number;
  /** Number of audio channels (1 = mono, 2 = stereo) */
  numberOfChannels: number;
  /** Length of the audio buffer in samples */
  length: number;
  /** Raw audio data for each channel */
  channelData: Float32Array[];
}

/**
 * Audio analysis results
 */
export interface AudioAnalysis {
  /** Peak amplitude level (0.0 to 1.0) */
  peakLevel: number;
  /** RMS (Root Mean Square) amplitude level */
  rmsLevel: number;
  /** Peak amplitude in decibels */
  peakDecibels: number;
  /** RMS amplitude in decibels */
  rmsDecibels: number;
  /** Estimated perceived loudness */
  loudness: number;
}

/**
 * Audio waveform data for visualization
 */
export interface AudioWaveform {
  /** Array of amplitude values (0.0 to 1.0) */
  amplitudes: number[];
  /** Number of samples used for the waveform */
  samples: number;
  /** Minimum amplitude value */
  min: number;
  /** Maximum amplitude value */
  max: number;
}

/**
 * Options for audio extraction
 */
export interface AudioExtractionOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Whether to analyze the audio (default: true) */
  analyze?: boolean;
  /** Whether to generate waveform data (default: true) */
  generateWaveform?: boolean;
  /** Number of samples for waveform (default: 1000) */
  waveformSamples?: number;
  /** AudioContext manager instance (optional) */
  audioContextManager?: AudioContextManager;
}

/**
 * Extracted audio data with metadata and analysis
 */
export interface ExtractedAudioData {
  /** Audio metadata */
  metadata: AudioMetadata;
  /** Audio buffer (can be used for playback/processing) */
  audioBuffer: AudioBuffer;
  /** Audio analysis results (if enabled) */
  analysis?: AudioAnalysis;
  /** Waveform data (if enabled) */
  waveform?: AudioWaveform;
}

/**
 * Error thrown when audio extraction fails
 */
export class AudioExtractionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'AudioExtractionError';
  }
}

/**
 * Extract audio data from a video file using Web Audio API
 *
 * @param file - The video file to extract audio from
 * @param options - Extraction options
 * @returns Promise containing extracted audio data
 *
 * @example
 * ```ts
 * const audioData = await extractAudioData(videoFile);
 * console.log(`Duration: ${audioData.metadata.duration}s`);
 * console.log(`Sample Rate: ${audioData.metadata.sampleRate}Hz`);
 * console.log(`Channels: ${audioData.metadata.numberOfChannels}`);
 * ```
 */
export async function extractAudioData(
  file: File,
  options: AudioExtractionOptions = {}
): Promise<ExtractedAudioData> {
  const {
    timeout = 30000,
    analyze = true,
    generateWaveform = true,
    waveformSamples = 1000,
    audioContextManager,
  } = options;

  // Get or create AudioContext manager
  const manager = audioContextManager || getAudioContextManager();

  try {
    // Initialize AudioContext (may require user gesture)
    await manager.initialize();

    // Read file as ArrayBuffer
    const arrayBuffer = await readFileAsArrayBuffer(file, timeout);

    // Decode audio data
    const audioBuffer = await manager.decodeAudioData(arrayBuffer);

    // Extract metadata
    const metadata = extractMetadata(audioBuffer);

    const result: ExtractedAudioData = {
      metadata,
      audioBuffer,
    };

    // Analyze audio if requested
    if (analyze) {
      result.analysis = analyzeAudio(audioBuffer);
    }

    // Generate waveform if requested
    if (generateWaveform) {
      result.waveform = generateWaveformData(audioBuffer, waveformSamples);
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new AudioExtractionError('Failed to extract audio data', error);
    }
    throw new AudioExtractionError('Failed to extract audio data');
  }
}

/**
 * Extract audio data from a video URL
 *
 * @param url - The URL of the video
 * @param options - Extraction options
 * @returns Promise containing extracted audio data
 *
 * @example
 * ```ts
 * const audioData = await extractAudioDataFromUrl('/video.mp4');
 * console.log(`Duration: ${audioData.metadata.duration}s`);
 * ```
 */
export async function extractAudioDataFromUrl(
  url: string,
  options: AudioExtractionOptions = {}
): Promise<ExtractedAudioData> {
  const {
    timeout = 30000,
    analyze = true,
    generateWaveform = true,
    waveformSamples = 1000,
    audioContextManager,
  } = options;

  // Get or create AudioContext manager
  const manager = audioContextManager || getAudioContextManager();

  try {
    // Initialize AudioContext
    await manager.initialize();

    // Fetch and decode audio from URL
    const response = await fetchWithTimeout(url, timeout);
    const arrayBuffer = await response.arrayBuffer();

    // Decode audio data
    const audioBuffer = await manager.decodeAudioData(arrayBuffer);

    // Extract metadata
    const metadata = extractMetadata(audioBuffer);

    const result: ExtractedAudioData = {
      metadata,
      audioBuffer,
    };

    // Analyze audio if requested
    if (analyze) {
      result.analysis = analyzeAudio(audioBuffer);
    }

    // Generate waveform if requested
    if (generateWaveform) {
      result.waveform = generateWaveformData(audioBuffer, waveformSamples);
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new AudioExtractionError('Failed to extract audio data from URL', error);
    }
    throw new AudioExtractionError('Failed to extract audio data from URL');
  }
}

/**
 * Extract metadata from an AudioBuffer
 */
function extractMetadata(audioBuffer: AudioBuffer): AudioMetadata {
  const channelData: Float32Array[] = [];

  // Extract data from each channel
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    channelData.push(audioBuffer.getChannelData(channel));
  }

  return {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels,
    length: audioBuffer.length,
    channelData,
  };
}

/**
 * Analyze audio buffer to extract amplitude and loudness information
 */
export function analyzeAudio(audioBuffer: AudioBuffer): AudioAnalysis {
  let peakLevel = 0;
  let sumSquares = 0;
  let totalSamples = 0;

  // Analyze all channels
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const data = audioBuffer.getChannelData(channel);

    for (let i = 0; i < data.length; i++) {
      const sample = Math.abs(data[i]);
      peakLevel = Math.max(peakLevel, sample);
      sumSquares += sample * sample;
      totalSamples++;
    }
  }

  // Calculate RMS
  const rmsLevel = Math.sqrt(sumSquares / totalSamples);

  // Convert to decibels (using -Infinity as minimum)
  const peakDecibels = peakLevel > 0 ? 20 * Math.log10(peakLevel) : -Infinity;
  const rmsDecibels = rmsLevel > 0 ? 20 * Math.log10(rmsLevel) : -Infinity;

  // Estimate loudness (simplified EBU R128 approximation)
  const loudness = rmsDecibels === -Infinity ? -Infinity : rmsDecibels - 10;

  return {
    peakLevel,
    rmsLevel,
    peakDecibels,
    rmsDecibels,
    loudness,
  };
}

/**
 * Generate waveform data for visualization
 *
 * @param audioBuffer - The audio buffer to generate waveform from
 * @param samples - Number of samples in the waveform (default: 1000)
 * @returns Waveform data with amplitude values
 */
export function generateWaveformData(
  audioBuffer: AudioBuffer,
  samples: number = 1000
): AudioWaveform {
  const amplitudes: number[] = [];
  const blockSize = Math.floor(audioBuffer.length / samples);
  let maxAmplitude = 0;
  let minAmplitude = 1;

  // If mono, use single channel; if stereo/multi-channel, average all channels
  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, audioBuffer.length);

    let sum = 0;
    let count = 0;

    // Average across all channels
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const data = audioBuffer.getChannelData(channel);

      for (let j = start; j < end; j++) {
        sum += Math.abs(data[j]);
        count++;
      }
    }

    const amplitude = count > 0 ? sum / count : 0;
    amplitudes.push(amplitude);

    maxAmplitude = Math.max(maxAmplitude, amplitude);
    minAmplitude = Math.min(minAmplitude, amplitude);
  }

  return {
    amplitudes,
    samples,
    min: minAmplitude,
    max: maxAmplitude,
  };
}

/**
 * Extract a segment of audio from the buffer
 *
 * @param audioBuffer - The source audio buffer
 * @param startTime - Start time in seconds
 * @param duration - Duration in seconds
 * @returns New AudioBuffer containing the extracted segment
 */
export function extractAudioSegment(
  audioBuffer: AudioBuffer,
  startTime: number,
  duration: number
): AudioBuffer {
  const startSample = Math.floor(startTime * audioBuffer.sampleRate);
  const endSample = Math.min(
    startSample + Math.floor(duration * audioBuffer.sampleRate),
    audioBuffer.length
  );
  const segmentLength = endSample - startSample;

  // Create new buffer for the segment
  const segmentBuffer = new AudioBuffer({
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels,
    length: segmentLength,
  });

  // Copy data for each channel
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const segmentData = segmentBuffer.getChannelData(channel);

    for (let i = 0; i < segmentLength; i++) {
      segmentData[i] = sourceData[startSample + i];
    }
  }

  return segmentBuffer;
}

/**
 * Convert audio buffer to WAV format
 *
 * @param audioBuffer - The audio buffer to convert
 * @returns ArrayBuffer containing WAV file data
 */
export function audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const length = audioBuffer.length * audioBuffer.numberOfChannels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, length - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, 1, true); // Audio format (PCM)
  view.setUint16(22, audioBuffer.numberOfChannels, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * audioBuffer.numberOfChannels * 2, true);
  view.setUint16(32, audioBuffer.numberOfChannels * 2, true);
  view.setUint16(34, 16, true); // Bits per sample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, length - 44, true);

  // Write audio data
  const offset = 44;
  const channels = [];
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  let index = offset;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      index += 2;
    }
  }

  return arrayBuffer;
}

/**
 * Helper function to write strings to DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Read file as ArrayBuffer with timeout
 */
async function readFileAsArrayBuffer(file: File, timeout: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const timeoutId = setTimeout(() => {
      reader.abort();
      reject(new Error(`File reading timed out after ${timeout}ms`));
    }, timeout);

    reader.onload = () => {
      clearTimeout(timeoutId);
      resolve(reader.result as ArrayBuffer);
    };

    reader.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to read file'));
    };

    reader.onabort = () => {
      clearTimeout(timeoutId);
      reject(new Error('File reading was aborted'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Format audio metadata for display
 *
 * @param metadata - The audio metadata to format
 * @returns Object with formatted strings
 */
export function formatAudioMetadata(metadata: AudioMetadata): {
  duration: string;
  sampleRate: string;
  channels: string;
  length: string;
} {
  const minutes = Math.floor(metadata.duration / 60);
  const seconds = Math.floor(metadata.duration % 60);
  const durationStr = minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds}s`;

  const sampleRateKhz = metadata.sampleRate >= 1000
    ? `${(metadata.sampleRate / 1000).toFixed(1)} kHz`
    : `${metadata.sampleRate} Hz`;

  const channelsStr = metadata.numberOfChannels === 1
    ? 'Mono'
    : metadata.numberOfChannels === 2
    ? 'Stereo'
    : `${metadata.numberOfChannels} Channels`;

  const lengthStr = metadata.length.toLocaleString();

  return {
    duration: durationStr,
    sampleRate: sampleRateKhz,
    channels: channelsStr,
    length: lengthStr,
  };
}

/**
 * Format analysis results for display
 *
 * @param analysis - The audio analysis to format
 * @returns Object with formatted strings
 */
export function formatAudioAnalysis(analysis: AudioAnalysis): {
  peakLevel: string;
  rmsLevel: string;
  peakDecibels: string;
  rmsDecibels: string;
  loudness: string;
} {
  return {
    peakLevel: (analysis.peakLevel * 100).toFixed(2) + '%',
    rmsLevel: (analysis.rmsLevel * 100).toFixed(2) + '%',
    peakDecibels: isFinite(analysis.peakDecibels)
      ? analysis.peakDecibels.toFixed(2) + ' dB'
      : '-∞ dB',
    rmsDecibels: isFinite(analysis.rmsDecibels)
      ? analysis.rmsDecibels.toFixed(2) + ' dB'
      : '-∞ dB',
    loudness: isFinite(analysis.loudness)
      ? analysis.loudness.toFixed(2) + ' LUFS'
      : '-∞ LUFS',
  };
}
