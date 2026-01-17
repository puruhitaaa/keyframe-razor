/**
 * AudioContextManager - Singleton manager for Web Audio Context
 *
 * Handles Web Audio API initialization, lifecycle management, and browser
 * autoplay restrictions. Ensures only one AudioContext exists and manages
 * its state properly.
 */

export type AudioContextState = 'suspended' | 'running' | 'closed' | 'interrupted' | 'uninitialized';

export interface AudioContextManagerConfig {
  /** Sample rate for the audio context (optional, defaults to browser default) */
  sampleRate?: number;
  /** Latency hint for the audio context (optional) */
  latencyHint?: AudioContextLatencyCategory | 'interactive' | 'balanced' | 'playback';
}

/**
 * Event types emitted by the AudioContextManager
 */
export type AudioContextEvent =
  | { type: 'stateChange'; state: AudioContextState }
  | { type: 'error'; error: Error }
  | { type: 'userGestureRequired' }
  | { type: 'initialized'; context: AudioContext };

type EventListener = (event: AudioContextEvent) => void;

/**
 * AudioContextManager - Singleton class
 *
 * Usage:
 * ```ts
 * const manager = AudioContextManager.getInstance();
 *
 * // Initialize (requires user gesture on first call)
 * await manager.initialize();
 *
 * // Get the audio context
 * const context = manager.getContext();
 *
 * // Resume if suspended (after user gesture)
 * await manager.resume();
 *
 * // Listen to events
 * manager.on((event) => {
 *   if (event.type === 'stateChange') {
 *     console.log('Audio context state:', event.state);
 *   }
 * });
 * ```
 */
export class AudioContextManager {
  private static instance: AudioContextManager | null = null;
  private context: AudioContext | null = null;
  private config: AudioContextManagerConfig;
  private state: AudioContextState = 'uninitialized';
  private listeners: Set<EventListener> = new Set();
  private initializationPromise: Promise<AudioContext> | null = null;

  private constructor(config: AudioContextManagerConfig = {}) {
    this.config = config;
  }

  /**
   * Get the singleton instance of AudioContextManager
   */
  public static getInstance(config?: AudioContextManagerConfig): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager(config);
    }
    return AudioContextManager.instance;
  }

  /**
   * Initialize the AudioContext
   *
   * Note: This may require a user gesture (click, tap, keydown) due to browser
   * autoplay restrictions. The context will be created in 'suspended' state
   * and needs to be resumed.
   */
  public async initialize(): Promise<AudioContext> {
    // Return existing initialization if in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return existing context if already initialized
    if (this.context && this.state !== 'closed') {
      return this.context;
    }

    this.initializationPromise = this.createContext();

    try {
      const context = await this.initializationPromise;
      return context;
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Create a new AudioContext instance
   */
  private async createContext(): Promise<AudioContext> {
    try {
      // Create new AudioContext with config
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
        latencyHint: this.config.latencyHint,
      });

      this.context = audioContext;
      this.state = audioContext.state;

      // Listen to state changes
      audioContext.onstatechange = () => {
        this.updateState(audioContext.state);
      };

      // Emit initialized event
      this.emit({ type: 'initialized', context: audioContext });
      this.emit({ type: 'stateChange', state: audioContext.state });

      return audioContext;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err });
      throw err;
    }
  }

  /**
   * Resume the AudioContext if it's suspended
   *
   * This should be called after a user gesture (click, tap, keydown) to
   * comply with browser autoplay restrictions.
   */
  public async resume(): Promise<void> {
    if (!this.context) {
      await this.initialize();
    }

    if (this.context && this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.emit({ type: 'error', error: err });
        throw err;
      }
    }
  }

  /**
   * Suspend the AudioContext
   */
  public async suspend(): Promise<void> {
    if (this.context && this.context.state === 'running') {
      try {
        await this.context.suspend();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.emit({ type: 'error', error: err });
        throw err;
      }
    }
  }

  /**
   * Close the AudioContext and release resources
   */
  public async close(): Promise<void> {
    if (this.context && this.state !== 'closed') {
      try {
        await this.context.close();
        this.updateState('closed');
        this.context = null;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.emit({ type: 'error', error: err });
        throw err;
      }
    }
  }

  /**
   * Reset the manager and create a new AudioContext
   */
  public async reset(): Promise<AudioContext> {
    await this.close();
    return this.initialize();
  }

  /**
   * Get the current AudioContext instance
   * Returns null if not initialized
   */
  public getContext(): AudioContext | null {
    return this.context;
  }

  /**
   * Get the current state of the AudioContext
   */
  public getState(): AudioContextState {
    return this.state;
  }

  /**
   * Check if the AudioContext is ready for use
   */
  public isReady(): boolean {
    return this.state === 'running';
  }

  /**
   * Check if the AudioContext has been initialized
   */
  public isInitialized(): boolean {
    return this.state !== 'uninitialized' && this.state !== 'closed';
  }

  /**
   * Check if the AudioContext is suspended and needs a user gesture to resume
   */
  public needsUserGesture(): boolean {
    return this.state === 'suspended';
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
  private emit(event: AudioContextEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in AudioContextManager event listener:', error);
      }
    });
  }

  /**
   * Update the internal state and emit state change event
   */
  private updateState(newState: AudioContextState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.emit({ type: 'stateChange', state: newState });
    }
  }

  /**
   * Helper method to ensure context is ready before performing audio operations
   * This will throw an error if a user gesture is required
   */
  public async ensureReady(): Promise<AudioContext> {
    if (!this.context) {
      await this.initialize();
    }

    if (this.context!.state === 'suspended') {
      this.emit({ type: 'userGestureRequired' });
      throw new Error(
        'AudioContext is suspended. A user gesture (click, tap, keydown) is required to resume audio playback. Call resume() after a user interaction.'
      );
    }

    if (this.context!.state === 'closed') {
      await this.initialize();
    }

    return this.context!;
  }

  /**
   * Helper method to decode audio data with proper context management
   */
  public async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    const context = await this.ensureReady();
    return context.decodeAudioData(arrayBuffer);
  }

  /**
   * Create an audio buffer source node with proper context management
   */
  public createBufferSource(): AudioBufferSourceNode | null {
    if (!this.context || this.state === 'closed') {
      return null;
    }
    return this.context.createBufferSource();
  }

  /**
   * Create an analyser node with proper context management
   */
  public createAnalyser(): AnalyserNode | null {
    if (!this.context || this.state === 'closed') {
      return null;
    }
    return this.context.createAnalyser();
  }

  /**
   * Create a gain node with proper context management
   */
  public createGain(): GainNode | null {
    if (!this.context || this.state === 'closed') {
      return null;
    }
    return this.context.createGain();
  }
}

/**
 * Convenience function to get the AudioContextManager singleton instance
 */
export const getAudioContextManager = (config?: AudioContextManagerConfig): AudioContextManager => {
  return AudioContextManager.getInstance(config);
};

/**
 * React hook to use the AudioContextManager
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const audioManager = useAudioContextManager();
 *   const [state, setState] = useState<AudioContextState>('uninitialized');
 *
 *   useEffect(() => {
 *     const unsubscribe = audioManager.on((event) => {
 *       if (event.type === 'stateChange') {
 *         setState(event.state);
 *       }
 *     });
 *
 *     return unsubscribe;
 *   }, [audioManager]);
 *
 *   const handleClick = async () => {
 *     await audioManager.resume();
 *   };
 *
 *   return <button onClick={handleClick}>Resume Audio</button>;
 * }
 * ```
 */
export const useAudioContextManager = (): AudioContextManager => {
  // This is a simple wrapper - in a real React app, you might want to
  // use useContext to provide the manager instance
  return AudioContextManager.getInstance();
};
