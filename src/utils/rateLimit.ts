/**
 * Simple rate limiter
 */

export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(requestsPerMinute: number = 10) {
    this.maxRequests = requestsPerMinute;
    this.windowMs = 60000; // 1 minute
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    // Clean up old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      // Calculate how long to wait
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.acquire(); // Retry after waiting
      }
    }

    this.requests.push(now);
  }
}
