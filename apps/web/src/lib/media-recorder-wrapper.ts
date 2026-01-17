/**
 * MediaRecorderWrapper - Wrapper around MediaRecorder API
 *
 * Provides error handling, format support detection, and browser compatibility checks
 * for MediaRecorder API. Handles different MIME types and provides fallback support.
 */

export type MediaRecorderState = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export interface MediaRecorderConfig {
  /** MIME type for the recording (optional, will auto-detect if not specified) */
  mimeType?: string;
  /** Audio bitrate in bits per second (optional) */
  audioBitsPerSecond?: number;
  /** Video bitrate in bits per second (optional) */
  videoBitsPerSecond?: number;
  /** Target bitrate in bits per second (optional) */
  bitsPerSecond?: number;
  /** Time slice in milliseconds for ondataavailable events (optional) */
  timeSlice?: number;
}

export interface MediaRecorderStartOptions {
  /** Time slice in milliseconds for ondataavailable events */
  timeSlice?: number;
}

/**
 * Event types emitted by the MediaRecorderWrapper
 */
export type MediaRecorderEvent =
  | { type: 'start'; blob: Blob | null }
  | { type: 'stop'; blob: Blob | null }
  | { type: 'dataavailable'; blob: Blob | null }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'error'; error: Error; name: string }
  | { type: 'stateChange'; state: MediaRecorderState }
  | { type: 'unsupported'; mimeType: string };

type EventListener = (event: MediaRecorderEvent) => void;

/**
 * Supported MIME types by browser
 */
const COMMON_VIDEO_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4',
];

const COMMON_AUDIO_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
  'audio/mp3',
  'audio/wav',
];

/**
 * MediaRecorderWrapper - Wrapper class for MediaRecorder API
 *
 * Usage:
 * ```ts
 * const wrapper = new MediaRecorderWrapper();
 *
 * // Check if MediaRecorder is supported
 * if (!wrapper.isSupported()) {
 *   console.error('MediaRecorder not supported');
 * }
 *
 * // Get supported MIME types
 * const supportedTypes = wrapper.getSupportedMimeTypes();
 *
 * // Start recording from a MediaStream
 * const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
 * await wrapper.start(stream, { mimeType: 'video/webm' });
 *
 * // Listen to events
 * wrapper.on((event) => {
 *   if (event.type === 'dataavailable') {
 *     console.log('Data available:', event.blob);
 *   }
 *   if (event.type === 'stop') {
 *     console.log('Recording stopped:', event.blob);
 *   }
 * });
 *
 * // Pause recording
 * wrapper.pause();
 *
 * // Resume recording
 * wrapper.resume();
 *
 * // Stop recording
 * await wrapper.stop();
 *
 * // Get recorded blobs
 * const blobs = wrapper.getRecordedBlobs();
 * ```
 */
export class MediaRecorderWrapper {
  private mediaRecorder: MediaRecorder | null = null;
  private config: MediaRecorderConfig;
  private state: MediaRecorderState = 'idle';
  private listeners: Set<EventListener> = new Set();
  private recordedBlobs: Blob[] = [];
  private stream: MediaStream | null = null;

  constructor(config: MediaRecorderConfig = {}) {
    this.config = config;
  }

  /**
   * Check if MediaRecorder is supported in the current browser
   */
  public static isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined';
  }

  /**
   * Check if MediaRecorder is supported
   */
  public isSupported(): boolean {
    return MediaRecorderWrapper.isSupported();
  }

  /**
   * Get all supported MIME types for video recording
   */
  public getSupportedVideoMimeTypes(): string[] {
    if (!this.isSupported()) {
      return [];
    }

    return COMMON_VIDEO_TYPES.filter(mimeType => {
      try {
        return MediaRecorder.isTypeSupported(mimeType);
      } catch {
        return false;
      }
    });
  }

  /**
   * Get all supported MIME types for audio recording
   */
  public getSupportedAudioMimeTypes(): string[] {
    if (!this.isSupported()) {
      return [];
    }

    return COMMON_AUDIO_TYPES.filter(mimeType => {
      try {
        return MediaRecorder.isTypeSupported(mimeType);
      } catch {
        return false;
      }
    });
  }

  /**
   * Get all supported MIME types
   */
  public getSupportedMimeTypes(): string[] {
    return [...this.getSupportedVideoMimeTypes(), ...this.getSupportedAudioMimeTypes()];
  }

  /**
   * Check if a specific MIME type is supported
   */
  public isMimeTypeSupported(mimeType: string): boolean {
    if (!this.isSupported()) {
      return false;
    }

    try {
      return MediaRecorder.isTypeSupported(mimeType);
    } catch {
      return false;
    }
  }

  /**
   * Get the best supported MIME type based on preference
   * Returns the first supported type from the preferences array
   */
  public getBestMimeType(preferences: string[]): string | null {
    for (const mimeType of preferences) {
      if (this.isMimeTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    return null;
  }

  /**
   * Detect and return the best available MIME type for video recording
   */
  public detectBestVideoMimeType(): string | null {
    return this.getBestMimeType(COMMON_VIDEO_TYPES);
  }

  /**
   * Detect and return the best available MIME type for audio recording
   */
  public detectBestAudioMimeType(): string | null {
    return this.getBestMimeType(COMMON_AUDIO_TYPES);
  }

  /**
   * Start recording from a MediaStream
   */
  public async start(
    stream: MediaStream,
    options: MediaRecorderStartOptions & Partial<MediaRecorderConfig> = {}
  ): Promise<void> {
    if (!this.isSupported()) {
      const error = new Error('MediaRecorder is not supported in this browser');
      this.emit({ type: 'error', error, name: 'NotSupportedError' });
      this.updateState('error');
      throw error;
    }

    if (this.state === 'recording') {
      throw new Error('MediaRecorder is already recording');
    }

    // Store the stream
    this.stream = stream;

    // Determine the MIME type to use
    let mimeType = options.mimeType || this.config.mimeType;

    // If no MIME type specified, auto-detect the best one
    if (!mimeType) {
      const hasVideo = stream.getVideoTracks().length > 0;
      const detectedMimeType = hasVideo
        ? this.detectBestVideoMimeType()
        : this.detectBestAudioMimeType();

      mimeType = detectedMimeType || undefined;

      if (!mimeType) {
        const error = new Error('No supported MIME type found for this browser');
        this.emit({ type: 'error', error, name: 'NotSupportedError' });
        this.updateState('error');
        throw error;
      }
    }

    // Verify the MIME type is supported
    if (!this.isMimeTypeSupported(mimeType)) {
      this.emit({ type: 'unsupported', mimeType });
      const error = new Error(
        `MIME type "${mimeType}" is not supported in this browser. Supported types: ${this.getSupportedMimeTypes().join(', ')}`
      );
      this.emit({ type: 'error', error, name: 'NotSupportedError' });
      this.updateState('error');
      throw error;
    }

    // Create MediaRecorder instance
    try {
      const recorderOptions: MediaRecorderOptions = {
        mimeType,
        audioBitsPerSecond: options.audioBitsPerSecond ?? this.config.audioBitsPerSecond,
        videoBitsPerSecond: options.videoBitsPerSecond ?? this.config.videoBitsPerSecond,
        bitsPerSecond: options.bitsPerSecond ?? this.config.bitsPerSecond,
      };

      // Remove undefined values
      Object.keys(recorderOptions).forEach(key => {
        if (recorderOptions[key as keyof MediaRecorderOptions] === undefined) {
          delete recorderOptions[key as keyof MediaRecorderOptions];
        }
      });

      this.mediaRecorder = new MediaRecorder(stream, recorderOptions);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err, name: 'UnknownError' });
      this.updateState('error');
      throw err;
    }

    // Set up event listeners
    this.setupEventListeners();

    // Clear previous recorded blobs
    this.recordedBlobs = [];

    // Start recording
    try {
      const timeSlice = options.timeSlice ?? this.config.timeSlice;
      if (timeSlice !== undefined) {
        this.mediaRecorder.start(timeSlice);
      } else {
        this.mediaRecorder.start();
      }

      this.updateState('recording');
      this.emit({ type: 'start', blob: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err, name: 'UnknownError' });
      this.updateState('error');
      throw err;
    }
  }

  /**
   * Stop recording
   */
  public async stop(): Promise<void> {
    if (!this.mediaRecorder || this.state === 'idle' || this.state === 'stopped') {
      return;
    }

    return new Promise((resolve, reject) => {
      // Set up a one-time listener for the stop event
      const stopListener = (event: MediaRecorderEvent) => {
        if (event.type === 'stop' || event.type === 'error') {
          this.off(stopListener);
          if (event.type === 'error') {
            reject(event.error);
          } else {
            resolve();
          }
        }
      };

      this.on(stopListener);

      try {
        this.mediaRecorder!.stop();
      } catch (error) {
        this.off(stopListener);
        const err = error instanceof Error ? error : new Error(String(error));
        this.emit({ type: 'error', error: err, name: 'UnknownError' });
        reject(err);
      }
    });
  }

  /**
   * Pause recording
   */
  public pause(): void {
    if (!this.mediaRecorder || this.state !== 'recording') {
      throw new Error('MediaRecorder is not recording');
    }

    try {
      this.mediaRecorder.pause();
      this.updateState('paused');
      this.emit({ type: 'pause' });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err, name: 'UnknownError' });
      this.updateState('error');
      throw err;
    }
  }

  /**
   * Resume recording
   */
  public resume(): void {
    if (!this.mediaRecorder || this.state !== 'paused') {
      throw new Error('MediaRecorder is not paused');
    }

    try {
      this.mediaRecorder.resume();
      this.updateState('recording');
      this.emit({ type: 'resume' });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err, name: 'UnknownError' });
      this.updateState('error');
      throw err;
    }
  }

  /**
   * Get the current state of the MediaRecorder
   */
  public getState(): MediaRecorderState {
    return this.state;
  }

  /**
   * Check if the MediaRecorder is currently recording
   */
  public isRecording(): boolean {
    return this.state === 'recording';
  }

  /**
   * Check if the MediaRecorder is paused
   */
  public isPaused(): boolean {
    return this.state === 'paused';
  }

  /**
   * Check if the MediaRecorder is idle (not started or stopped)
   */
  public isIdle(): boolean {
    return this.state === 'idle' || this.state === 'stopped';
  }

  /**
   * Get all recorded blobs
   */
  public getRecordedBlobs(): Blob[] {
    return [...this.recordedBlobs];
  }

  /**
   * Get the combined blob of all recorded data
   */
  public getCombinedBlob(): Blob | null {
    if (this.recordedBlobs.length === 0) {
      return null;
    }

    // Use the MIME type from the config or the first blob
    const mimeType = this.config.mimeType || this.recordedBlobs[0].type;

    return new Blob(this.recordedBlobs, { type: mimeType });
  }

  /**
   * Get the size of all recorded data in bytes
   */
  public getRecordedSize(): number {
    return this.recordedBlobs.reduce((total, blob) => total + blob.size, 0);
  }

  /**
   * Get the number of recorded data chunks
   */
  public getRecordedChunksCount(): number {
    return this.recordedBlobs.length;
  }

  /**
   * Get the MediaStream being recorded
   */
  public getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Get the underlying MediaRecorder instance
   */
  public getMediaRecorder(): MediaRecorder | null {
    return this.mediaRecorder;
  }

  /**
   * Reset the wrapper and clear all recorded data
   */
  public reset(): void {
    if (this.mediaRecorder && this.state !== 'idle' && this.state !== 'stopped') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore errors when stopping during reset
      }
    }

    this.mediaRecorder = null;
    this.stream = null;
    this.recordedBlobs = [];
    this.updateState('idle');
  }

  /**
   * Register an event listener
   */
  public on(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.off(listener);
  }

  /**
   * Unregister an event listener
   */
  public off(listener: EventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Remove all event listeners
   */
  public removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: MediaRecorderEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in MediaRecorderWrapper event listener:', error);
      }
    });
  }

  /**
   * Update the internal state and emit state change event
   */
  private updateState(newState: MediaRecorderState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.emit({ type: 'stateChange', state: newState });
    }
  }

  /**
   * Set up event listeners for the MediaRecorder
   */
  private setupEventListeners(): void {
    if (!this.mediaRecorder) {
      return;
    }

    // Handle data available event
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedBlobs.push(event.data);
        this.emit({ type: 'dataavailable', blob: event.data });
      } else {
        this.emit({ type: 'dataavailable', blob: null });
      }
    };

    // Handle stop event
    this.mediaRecorder.onstop = () => {
      const blob = this.getCombinedBlob();
      this.updateState('stopped');
      this.emit({ type: 'stop', blob });
    };

    // Handle error event
    this.mediaRecorder.onerror = (event) => {
      const error = new Error(
        `MediaRecorder error: ${(event as any).error?.message || 'Unknown error'}`
      );
      const errorName = (event as any).error?.name || 'UnknownError';
      this.emit({ type: 'error', error, name: errorName });
      this.updateState('error');
    };

    // Handle pause event
    this.mediaRecorder.onpause = () => {
      this.updateState('paused');
      this.emit({ type: 'pause' });
    };

    // Handle resume event
    this.mediaRecorder.onresume = () => {
      this.updateState('recording');
      this.emit({ type: 'resume' });
    };

    // Handle start event
    this.mediaRecorder.onstart = () => {
      this.updateState('recording');
    };
  }
}

/**
 * Convenience function to get the supported MIME types
 */
export const getSupportedMimeTypes = (): string[] => {
  const wrapper = new MediaRecorderWrapper();
  return wrapper.getSupportedMimeTypes();
};

/**
 * Convenience function to check if MediaRecorder is supported
 */
export const isMediaRecorderSupported = (): boolean => {
  return MediaRecorderWrapper.isSupported();
};

/**
 * React hook to use the MediaRecorderWrapper
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const recorder = useMediaRecorderWrapper();
 *   const [isRecording, setIsRecording] = useState(false);
 *
 *   useEffect(() => {
 *     const unsubscribe = recorder.on((event) => {
 *       if (event.type === 'stateChange') {
 *         setIsRecording(event.state === 'recording');
 *       }
 *       if (event.type === 'stop') {
 *         console.log('Recording stopped:', event.blob);
 *       }
 *     });
 *
 *     return unsubscribe;
 *   }, [recorder]);
 *
 *   const startRecording = async () => {
 *     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 *     await recorder.start(stream);
 *   };
 *
 *   return (
 *     <button onClick={isRecording ? recorder.stop : startRecording}>
 *       {isRecording ? 'Stop' : 'Start'}
 *     </button>
 *   );
 * }
 * ```
 */
export const useMediaRecorderWrapper = (
  config?: MediaRecorderConfig
): MediaRecorderWrapper => {
  return new MediaRecorderWrapper(config);
};
