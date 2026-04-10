/**
 * Technical Analysis tool — thin MCP wrapper around TAClient.
 */

import { TAClient, DEFAULT_TIMEFRAMES, VALID_TIMEFRAMES } from "../api/ta.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";

export class TATool {
  private taClient: TAClient;

  constructor(
    private client: any, // TradingViewClient
    private cache: Cache,
    private rateLimiter: RateLimiter
  ) {
    this.taClient = new TAClient(client, cache, rateLimiter);
  }

  async getTASummary(input: {
    symbols: string[];
    timeframes?: string[];
    include_components?: boolean;
  }): Promise<any> {
    return this.taClient.getTASummary({
      symbols: input.symbols,
      timeframes: input.timeframes as any,
      include_components: input.include_components,
    });
  }

  async rankByTA(input: {
    symbols: string[];
    timeframes?: string[];
    weights?: Record<string, number>;
  }): Promise<any> {
    return this.taClient.rankByTA({
      symbols: input.symbols,
      timeframes: input.timeframes as any,
      weights: input.weights,
    });
  }
}