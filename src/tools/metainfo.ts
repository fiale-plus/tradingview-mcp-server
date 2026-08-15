/**
 * Metainfo tool
 */

import type { MetainfoClient, MetainfoInput } from "../api/metainfo.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";
import {
  createResultMetadata,
  withCacheHitMetadata,
  withResultMetadata,
} from "../utils/resultMetadata.js";

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
      const cachedFields = cached.metainfo?.fields;
      return withCacheHitMetadata(cached, {
        source: `https://scanner.tradingview.com/${input.market}/metainfo`,
        requested_count: input.fields?.length ?? 0,
        returned_count: Array.isArray(cachedFields) ? cachedFields.length : 0,
      });
    }

    // Rate limit
    await this.rateLimiter.acquire();

    // Make request
    const result = await this.client.getMetainfo(input);

    const resultWithMetadata = withResultMetadata(
      result,
      createResultMetadata({
        source: `https://scanner.tradingview.com/${input.market}/metainfo`,
        requested_count: input.fields?.length ?? 0,
        returned_count: Array.isArray(result.metainfo?.fields) ? result.metainfo.fields.length : 0,
      }),
    );
    this.cache.set(cacheKey, resultWithMetadata);

    return resultWithMetadata;
  }
}