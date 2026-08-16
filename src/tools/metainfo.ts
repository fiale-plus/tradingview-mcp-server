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

function countFieldCollection(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "object" && value !== null) return Object.keys(value).length;
  return 0;
}

function countReturnedFields(value: unknown): number {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return 0;
  if ("metainfo" in value && typeof value.metainfo === "object" && value.metainfo !== null) {
    const metainfo = value.metainfo;
    if ("fields" in metainfo) return countFieldCollection(metainfo.fields);
    if ("columns" in metainfo) return countFieldCollection(metainfo.columns);
  }
  if ("raw" in value) {
    const raw = value.raw;
    if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
      if ("fields" in raw) return countFieldCollection(raw.fields);
      if ("columns" in raw) return countFieldCollection(raw.columns);
    }
    return countFieldCollection(raw);
  }
  return 0;
}

function metainfoSource(market: string): string {
  return `https://scanner.tradingview.com/${encodeURIComponent(market.trim())}/metainfo`;
}

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
      return withCacheHitMetadata(cached, {
        source: metainfoSource(input.market),
        requested_count: input.fields?.length ?? 0,
        returned_count: countReturnedFields(cached),
      });
    }

    // Rate limit
    await this.rateLimiter.acquire();

    // Make request
    const result = await this.client.getMetainfo(input);
    const resultWithMetadata = withResultMetadata(
      result,
      createResultMetadata({
        source: metainfoSource(input.market),
        requested_count: input.fields?.length ?? 0,
        returned_count: countReturnedFields(result),
      }),
    );
    this.cache.set(cacheKey, resultWithMetadata);

    return resultWithMetadata;
  }
}