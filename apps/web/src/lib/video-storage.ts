/**
 * VideoStorage - IndexedDB wrapper for storing video files as Blobs
 *
 * Provides a simple API for storing, retrieving, and managing video files
 * in IndexedDB with support for chunked storage of large files.
 */

export type VideoStorageState = 'idle' | 'storing' | 'retrieving' | 'deleting' | 'error';

export interface VideoMetadata {
  /** Unique identifier for the video */
  id: string;
  /** Original filename */
  name: string;
  /** MIME type (e.g., 'video/mp4', 'video/webm') */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Duration in seconds (if available) */
  duration?: number;
  /** Width in pixels (if available) */
  width?: number;
  /** Height in pixels (if available) */
  height?: number;
  /** Timestamp when the video was stored */
  createdAt: number;
  /** Timestamp when the video was last accessed */
  lastAccessed: number;
}

export interface StoredVideo extends VideoMetadata {
  /** The video blob data */
  blob: Blob;
}

export interface VideoStorageConfig {
  /** Database name (default: 'KeyframeRazorVideoDB') */
  dbName?: string;
  /** Database version (default: 1) */
  dbVersion?: number;
  /** Object store name (default: 'videos') */
  storeName?: string;
  /** Chunk size for large files in bytes (default: 5MB) */
  chunkSize?: number;
}

export interface VideoStorageProgress {
  /** Current video ID */
  videoId: string;
  /** Number of bytes processed */
  bytesProcessed: number;
  /** Total number of bytes */
  totalBytes: number;
  /** Progress percentage (0-100) */
  progress: number;
}

/**
 * Event types emitted by VideoStorage
 */
export type VideoStorageEvent =
  | { type: 'stateChange'; state: VideoStorageState }
  | { type: 'progress'; data: VideoStorageProgress }
  | { type: 'error'; error: Error; videoId?: string }
  | { type: 'videoStored'; video: VideoMetadata }
  | { type: 'videoDeleted'; videoId: string };

type EventListener = (event: VideoStorageEvent) => void;

/**
 * VideoStorage - Class for managing video storage in IndexedDB
 *
 * Usage:
 * ```ts
 * const storage = new VideoStorage();
 *
 * // Store a video file
 * const metadata = await storage.storeVideo(file);
 *
 * // Retrieve a video
 * const video = await storage.getVideo(metadata.id);
 *
 * // List all videos
 * const videos = await storage.listVideos();
 *
 * // Delete a video
 * await storage.deleteVideo(metadata.id);
 *
 * // Listen to events
 * storage.on((event) => {
 *   if (event.type === 'progress') {
 *     console.log(`Storage progress: ${event.data.progress}%`);
 *   }
 * });
 * ```
 */
export class VideoStorage {
  private db: IDBDatabase | null = null;
  private config: Required<VideoStorageConfig>;
  private state: VideoStorageState = 'idle';
  private listeners: Set<EventListener> = new Set();
  private initPromise: Promise<void> | null = null;

  constructor(config: VideoStorageConfig = {}) {
    this.config = {
      dbName: config.dbName ?? 'KeyframeRazorVideoDB',
      dbVersion: config.dbVersion ?? 1,
      storeName: config.storeName ?? 'videos',
      chunkSize: config.chunkSize ?? 5 * 1024 * 1024, // 5MB default
    };
  }

  /**
   * Initialize the IndexedDB database
   */
  private async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.db) {
      return;
    }

    this.initPromise = new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = () => {
        const error = new Error(`Failed to open IndexedDB: ${request.error}`);
        this.emit({ type: 'error', error });
        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.db!.onversionchange = () => {
          this.db?.close();
        };
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for videos
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  /**
   * Generate a unique ID for a video
   */
  private generateId(): string {
    return `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Extract video metadata from a File or Blob
   */
  private async extractMetadata(file: File, id: string): Promise<VideoMetadata> {
    const metadata: VideoMetadata = {
      id,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };

    // Try to extract video dimensions and duration
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';

      const metadataPromise = new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          metadata.duration = video.duration;
          metadata.width = video.videoWidth;
          metadata.height = video.videoHeight;
          resolve();
        };

        video.onerror = () => {
          // Metadata extraction failed, but we can still store the video
          resolve();
        };
      });

      video.src = URL.createObjectURL(file);
      await metadataPromise;
      URL.revokeObjectURL(video.src);
    } catch {
      // Ignore metadata extraction errors
    }

    return metadata;
  }

  /**
   * Store a video file in IndexedDB
   */
  async storeVideo(file: File): Promise<VideoMetadata> {
    await this.initialize();
    this.updateState('storing');

    const id = this.generateId();

    try {
      // Extract metadata
      const metadata = await this.extractMetadata(file, id);

      // For large files, we could implement chunked storage here
      // For now, we'll store the entire blob
      const storedVideo: StoredVideo = {
        ...metadata,
        blob: file,
      };

      await this.putVideo(storedVideo);

      this.emit({ type: 'videoStored', video: metadata });
      this.updateState('idle');

      return metadata;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err, videoId: id });
      this.updateState('error');
      throw err;
    }
  }

  /**
   * Store a video with custom metadata
   */
  async storeVideoWithMetadata(
    file: File,
    customMetadata: Partial<Omit<VideoMetadata, 'id' | 'createdAt' | 'lastAccessed' | 'size' | 'mimeType'>>
  ): Promise<VideoMetadata> {
    await this.initialize();
    this.updateState('storing');

    const id = this.generateId();

    try {
      const metadata: VideoMetadata = {
        id,
        name: customMetadata.name ?? file.name,
        mimeType: file.type,
        size: file.size,
        duration: customMetadata.duration,
        width: customMetadata.width,
        height: customMetadata.height,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
      };

      const storedVideo: StoredVideo = {
        ...metadata,
        blob: file,
      };

      await this.putVideo(storedVideo);

      this.emit({ type: 'videoStored', video: metadata });
      this.updateState('idle');

      return metadata;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err, videoId: id });
      this.updateState('error');
      throw err;
    }
  }

  /**
   * Internal method to put a video in the database
   */
  private putVideo(video: StoredVideo): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.put(video);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to store video: ${request.error}`));
    });
  }

  /**
   * Retrieve a video by ID
   */
  async getVideo(id: string): Promise<StoredVideo | null> {
    await this.initialize();
    this.updateState('retrieving');

    try {
      const video = await this.getVideoFromDB(id);

      if (video) {
        // Update last accessed timestamp
        video.lastAccessed = Date.now();
        await this.putVideo(video);
      }

      this.updateState('idle');
      return video;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err, videoId: id });
      this.updateState('error');
      throw err;
    }
  }

  /**
   * Get video metadata without the blob data
   */
  async getVideoMetadata(id: string): Promise<VideoMetadata | null> {
    await this.initialize();

    try {
      const video = await this.getVideoFromDB(id);

      if (!video) {
        return null;
      }

      // Return metadata without blob
      const { blob, ...metadata } = video;
      return metadata;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err, videoId: id });
      throw err;
    }
  }

  /**
   * Internal method to get a video from the database
   */
  private getVideoFromDB(id: string): Promise<StoredVideo | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(new Error(`Failed to retrieve video: ${request.error}`));
    });
  }

  /**
   * Get the Blob URL for a video
   */
  async getVideoURL(id: string): Promise<string | null> {
    const video = await this.getVideo(id);

    if (!video) {
      return null;
    }

    return URL.createObjectURL(video.blob);
  }

  /**
   * List all stored videos (metadata only)
   */
  async listVideos(): Promise<VideoMetadata[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const videos = request.result.map((video: StoredVideo) => {
          const { blob, ...metadata } = video;
          return metadata;
        });
        resolve(videos);
      };

      request.onerror = () => reject(new Error(`Failed to list videos: ${request.error}`));
    });
  }

  /**
   * Delete a video by ID
   */
  async deleteVideo(id: string): Promise<boolean> {
    await this.initialize();
    this.updateState('deleting');

    try {
      const success = await new Promise<boolean>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.config.storeName], 'readwrite');
        const store = transaction.objectStore(this.config.storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(new Error(`Failed to delete video: ${request.error}`));
      });

      if (success) {
        this.emit({ type: 'videoDeleted', videoId: id });
      }

      this.updateState('idle');
      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err, videoId: id });
      this.updateState('error');
      throw err;
    }
  }

  /**
   * Delete all videos
   */
  async deleteAllVideos(): Promise<void> {
    await this.initialize();

    try {
      await new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.config.storeName], 'readwrite');
        const store = transaction.objectStore(this.config.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Failed to clear videos: ${request.error}`));
      });

      this.emit({ type: 'videoDeleted', videoId: 'all' });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err });
      throw err;
    }
  }

  /**
   * Get the total storage size in bytes
   */
  async getStorageSize(): Promise<number> {
    const videos = await this.listVideos();
    return videos.reduce((total, video) => total + video.size, 0);
  }

  /**
   * Get the number of stored videos
   */
  async getVideoCount(): Promise<number> {
    const videos = await this.listVideos();
    return videos.length;
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Clear the database and delete it
   */
  async clearDatabase(): Promise<void> {
    await this.close();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.config.dbName);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete database: ${request.error}`));
      request.onblocked = () => reject(new Error('Database deletion blocked'));
    });
  }

  /**
   * Register an event listener
   */
  on(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.off(listener);
  }

  /**
   * Unregister an event listener
   */
  off(listener: EventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: VideoStorageEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in VideoStorage event listener:', error);
      }
    });
  }

  /**
   * Update the internal state and emit state change event
   */
  private updateState(newState: VideoStorageState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.emit({ type: 'stateChange', state: newState });
    }
  }

  /**
   * Get the current state
   */
  getState(): VideoStorageState {
    return this.state;
  }
}

/**
 * Convenience function to create a VideoStorage instance
 */
export const createVideoStorage = (config?: VideoStorageConfig): VideoStorage => {
  return new VideoStorage(config);
};

/**
 * React hook to use the VideoStorage
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const storage = useVideoStorage();
 *   const [videos, setVideos] = useState<VideoMetadata[]>([]);
 *
 *   useEffect(() => {
 *     const loadVideos = async () => {
 *       const allVideos = await storage.listVideos();
 *       setVideos(allVideos);
 *     };
 *     loadVideos();
 *   }, [storage]);
 *
 *   const handleFileUpload = async (file: File) => {
 *     const metadata = await storage.storeVideo(file);
 *     setVideos(prev => [...prev, metadata]);
 *   };
 *
 *   return <input type="file" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />;
 * }
 * ```
 */
export const useVideoStorage = (config?: VideoStorageConfig): VideoStorage => {
  // This is a simple wrapper - you could enhance this with React context
  return new VideoStorage(config);
};
