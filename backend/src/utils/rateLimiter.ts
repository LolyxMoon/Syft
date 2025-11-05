/**
 * Simple in-memory rate limiter for API calls
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 60, windowMs: 60000 }) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request should be allowed
   */
  async checkLimit(identifier: string): Promise<{ allowed: boolean; resetIn?: number }> {
    const now = Date.now();
    let record = this.requests.get(identifier);

    // Initialize or reset if window expired
    if (!record || now >= record.resetTime) {
      record = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      this.requests.set(identifier, record);
    }

    // Check if limit exceeded
    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        resetIn: Math.ceil((record.resetTime - now) / 1000),
      };
    }

    // Increment counter and allow
    record.count++;
    return { allowed: true };
  }

  /**
   * Cleanup expired records
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now >= record.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Export singleton instance
export const globalRateLimiter = new RateLimiter({
  maxRequests: 100, // 100 requests
  windowMs: 60000,  // per minute
});

// Export session-specific rate limiter
export const sessionRateLimiter = new RateLimiter({
  maxRequests: 30,  // 30 requests
  windowMs: 60000,  // per minute per session
});
