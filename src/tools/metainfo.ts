/**
 * Metainfo tool
 */

import type { MetainfoClient, MetainfoInput } from "../api/metainfo.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";

export class MetainfoTool {
  constructor(
    private client: MetainfoClient,
    private cache: Cache,
    private rateLimiter: RateLimiter
  ) {}

  async getMetainfo(input: MetainfoInput): Promise<any> {
    // Validate
    if (!input.market || input.market.trim().length < 1) {
      throw new Error("Market is required (e.g., 'america', 'uk', 'germany')");
    }

    // Build cache key
    const cacheKey = JSON.stringify({
      type: "metainfo",
      market: input.market,
      fields: input.fields,
      mode: input.mode || "summary",
    });

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Rate limit
    await this.rateLimiter.acquire();

    // Make request
    const result = await this.client.getMetainfo(input);

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }
}