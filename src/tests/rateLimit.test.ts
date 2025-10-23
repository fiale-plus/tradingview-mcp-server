import { describe, it } from "node:test";
import assert from "node:assert";
import { RateLimiter } from "../utils/rateLimit.js";

describe("RateLimiter", () => {
  it("should allow requests within limit", async () => {
    const limiter = new RateLimiter(5); // 5 requests per minute
    const start = Date.now();

    // Should allow 5 requests immediately
    for (let i = 0; i < 5; i++) {
      await limiter.acquire();
    }

    const elapsed = Date.now() - start;
    // Should complete quickly (within 100ms)
    assert.ok(elapsed < 100, `Took too long: ${elapsed}ms`);
  });

  it("should throttle requests exceeding limit", async () => {
    const limiter = new RateLimiter(2); // 2 requests per minute
    const start = Date.now();

    // First 2 requests should be fast
    await limiter.acquire();
    await limiter.acquire();

    const afterTwo = Date.now() - start;
    assert.ok(afterTwo < 100, "First two requests should be fast");

    // Third request should be delayed
    await limiter.acquire();

    const afterThree = Date.now() - start;
    // Should wait close to 60 seconds (allow some margin)
    assert.ok(afterThree >= 59000, `Should wait ~60s, but only waited ${afterThree}ms`);
  });

  it("should handle multiple requests correctly", async () => {
    const limiter = new RateLimiter(3);

    // Fire 3 requests - should complete quickly
    const promises = [
      limiter.acquire(),
      limiter.acquire(),
      limiter.acquire(),
    ];

    const start = Date.now();
    await Promise.all(promises);
    const elapsed = Date.now() - start;

    assert.ok(elapsed < 100, `Should complete quickly, took ${elapsed}ms`);
  });
});
