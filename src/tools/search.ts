/**
 * Symbol search tool
 */

import { createRequire } from "module";
import type { SearchClient, SearchSymbolsInput } from "../api/search.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";
import {
  createResultMetadata,
  withCacheHitMetadata,
  withResultMetadata,
} from "../utils/resultMetadata.js";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json");

export class SearchTool {
  constructor(
    private client: SearchClient,
    private cache: Cache,
    private rateLimiter: RateLimiter
  ) {}

  async searchSymbols(input: SearchSymbolsInput): Promise<any> {
    // Validate
    if (!input.query || input.query.trim().length < 1) {
      throw new Error("Query must be at least 1 character");
    }

    if (input.limit !== undefined && (input.limit < 1 || input.limit > 50)) {
      throw new Error("Limit must be between 1 and 50");
    }

    // Build cache key
    const cacheKey = JSON.stringify({
      type: "search",
      query: input.query,
      exchange: input.exchange,
      asset_type: input.asset_type,
      limit: input.limit || 20,
      start: input.start || 0,
    });

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return withCacheHitMetadata(cached, {
        source: "https://symbol-search.tradingview.com/symbol_search/v3",
        requested_count: input.limit ?? 20,
        returned_count: Array.isArray(cached.symbols) ? cached.symbols.length : 0,
      });
    }

    // Rate limit
    await this.rateLimiter.acquire();

    // Make request
    const result = await this.client.searchSymbols(input);

    // Cache result
    const resultWithMetadata = withResultMetadata(
      result,
      createResultMetadata({
        source: "https://symbol-search.tradingview.com/symbol_search/v3",
        requested_count: input.limit ?? 20,
        returned_count: Array.isArray(result.symbols) ? result.symbols.length : 0,
      }),
    );
    this.cache.set(cacheKey, resultWithMetadata);

    return resultWithMetadata;
  }
}