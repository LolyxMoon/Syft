/**
 * Retry logic with exponential backoff for network operations
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'tx_too_late'],
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toString() || '';

  // Check if error code or message contains retryable patterns
  return retryableErrors.some(
    (pattern) =>
      errorCode.includes(pattern.toLowerCase()) ||
      errorMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's the last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      );

      console.log(`Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms`);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Poll for a condition with timeout
 */
export async function pollUntil<T>(
  fn: () => Promise<T | null>,
  condition: (result: T | null) => boolean,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const { intervalMs = 1000, timeoutMs = 30000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const result = await fn();

    if (condition(result)) {
      return result as T;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Polling timeout exceeded');
}
