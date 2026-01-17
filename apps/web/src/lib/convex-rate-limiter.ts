/**
 * Convex Rate Limiter with Exponential Backoff
 *
 * Handles 429 Too Many Requests responses from Convex API calls
 * by implementing exponential backoff retry logic.
 *
 * This module provides utilities to intercept and handle rate limit errors
 * from Convex API calls, automatically retrying with exponential backoff.
 */

import type { FunctionReference, OptionalRestArgs } from "convex/server";

interface RateLimiterConfig {
  /** Maximum number of retry attempts for 429 errors (default: 5) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000ms) */
  initialDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Maximum delay between retries in milliseconds (default: 30000ms) */
  maxDelay?: number;
  /** Enable logging for debugging (default: false) */
  debug?: boolean;
}

/**
 * Rate limiter state shared across the application
 */
class ConvexRateLimiterState {
  private config: Required<RateLimiterConfig>;
  private retryCount = 0;

  constructor(config: RateLimiterConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 5,
      initialDelay: config.initialDelay ?? 1000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      maxDelay: config.maxDelay ?? 30000,
      debug: config.debug ?? false,
    };
  }

  /**
   * Log debug messages if debug mode is enabled
   */
  log(message: string, ...args: unknown[]) {
    if (this.config.debug) {
      console.log(`[ConvexRateLimiter] ${message}`, ...args);
    }
  }

  /**
   * Calculate delay for the next retry using exponential backoff
   */
  calculateRetryDelay(attemptNumber: number): number {
    const delay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attemptNumber),
      this.config.maxDelay
    );
    // Add some jitter to prevent thundering herd
    const jitter = delay * 0.1 * Math.random();
    return delay + jitter;
  }

  /**
   * Sleep for specified duration
   */
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute a function with rate limiting and retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        const result = await fn();

        // Reset retry count on success
        if (attempt === 0) {
          this.retryCount = 0;
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if error is a 429 rate limit error
        if (this.isRateLimitError(error) && attempt < this.config.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          this.log(
            `Rate limited (attempt ${attempt + 1}/${this.config.maxRetries}), retrying after ${Math.round(delay)}ms`
          );

          await this.sleep(delay);

          attempt++;
          this.retryCount = attempt;
          continue;
        }

        // If not a 429 error or max retries exceeded, throw
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Check if an error is a rate limit (429) error
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      const errorCode = (error as any).code;
      const errorStatus = (error as any).status;

      // Check for various 429 error patterns
      return (
        errorMessage.includes('429') ||
        errorMessage.includes('too many requests') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('rate limit exceeded') ||
        errorCode === 429 ||
        errorStatus === 429
      );
    }
    return false;
  }

  /**
   * Get current retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }
}

// Global rate limiter instance
let globalRateLimiter: ConvexRateLimiterState | null = null;

/**
 * Get or create the global rate limiter instance
 */
export function getRateLimiter(config?: RateLimiterConfig): ConvexRateLimiterState {
  if (!globalRateLimiter && config) {
    globalRateLimiter = new ConvexRateLimiterState(config);
  }
  if (!globalRateLimiter) {
    globalRateLimiter = new ConvexRateLimiterState();
  }
  return globalRateLimiter;
}

/**
 * Initialize the rate limiter with configuration
 * Call this during app initialization to configure the rate limiter
 */
export function initializeRateLimiter(config: RateLimiterConfig): void {
  globalRateLimiter = new ConvexRateLimiterState(config);
}

/**
 * Wrapper function to execute any async operation with rate limiting
 *
 * Usage:
 * ```ts
 * const result = await withRateLimit(() => api.projects.create({ name: "My Project" }));
 * ```
 */
export async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  const limiter = getRateLimiter();
  return limiter.execute(fn);
}

/**
 * Get current rate limiter status
 */
export function getRateLimitStatus() {
  const limiter = getRateLimiter();
  return {
    retryCount: limiter.getRetryCount(),
  };
}

/**
 * Create a rate-limited mutation wrapper
 *
 * Usage:
 * ```ts
 * const rateLimitedMutation = createRateLimitedMutation(api.projects.create);
 * await rateLimitedMutation({ name: "My Project" });
 * ```
 */
export function createRateLimitedMutation<
  Mutation extends FunctionReference<"mutation">
>(
  mutationFn: (...args: OptionalRestArgs<Mutation>) => Promise<any>
) {
  return async (...args: OptionalRestArgs<Mutation>) => {
    return withRateLimit(() => mutationFn(...args));
  };
}

/**
 * Create a rate-limited query wrapper
 *
 * Usage:
 * ```ts
 * const rateLimitedQuery = createRateLimitedQuery(api.projects.get);
 * const result = await rateLimitedQuery({ id: "..." });
 * ```
 */
export function createRateLimitedQuery<
  Query extends FunctionReference<"query">
>(
  queryFn: (...args: OptionalRestArgs<Query>) => Promise<any>
) {
  return async (...args: OptionalRestArgs<Query>) => {
    return withRateLimit(() => queryFn(...args));
  };
}

// Export types
export type { RateLimiterConfig };
export { ConvexRateLimiterState };
