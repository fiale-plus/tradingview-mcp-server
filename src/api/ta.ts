/**
 * TradingView Technical Analysis API
 *
 * Builds scanner requests with TA recommendation fields across timeframes
 * to produce TradingView-style technical summaries.
 * Uses the existing scanner infrastructure.
 */

import type { TradingViewClient } from "./client.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";

export type Timeframe = "1" | "3" | "5" | "15" | "30" | "45" | "60" | "120" | "180" | "240" | "1D" | "1W" | "1M";

export const VALID_TIMEFRAMES: Timeframe[] = ["1", "3", "5", "15", "30", "45", "60", "120", "180", "240", "1D", "1W", "1M"];

export const DEFAULT_TIMEFRAMES: Timeframe[] = ["60", "240", "1D", "1W"];

export interface TASummaryInput {
  symbols: string[];
  timeframes?: Timeframe[];
  include_components?: boolean;
}

export interface TASymbolSummary {
  symbol: string;
  timeframes: Record<string, {
    summary: string;
    scores: {
      all: number;
      oscillators?: number;
      moving_averages?: number;
    };
  }>;
}

export interface TASummaryResponse {
  symbols: TASymbolSummary[];
}

export interface RanksByTAInput {
  symbols: string[];
  timeframes?: Timeframe[];
  weights?: Record<string, number>;
}

export interface RankedSymbol {
  symbol: string;
  score: number;
  label: string;
  breakdown: Record<string, number>;
}

export interface RankByTAResponse {
  requested_symbols: number;
  timeframes: string[];
  weights: Record<string, number>;
  ranked: RankedSymbol[];
}

/**
 * Score → label mapping per spec:
 * <= -0.5 → strong_sell
 * > -0.5 && <= -0.1 → sell
 * > -0.1 && < 0.1 → neutral
 * >= 0.1 && < 0.5 → buy
 * >= 0.5 → strong_buy
 */
export function scoreToLabel(score: number): string {
  if (score <= -0.5) return "strong_sell";
  if (score <= -0.1) return "sell";
  if (score < 0.1) return "neutral";
  if (score < 0.5) return "buy";
  return "strong_buy";
}

/**
 * Build the columns needed for a TA summary across given timeframes.
 *
 * TradingView recommendation fields:
 *   Recommend.All — composite score
 *   Recommend.Other — oscillator-based score
 *   Recommend.MA — moving average-based score
 *
 * Timeframe variants: field|timeframe e.g. "Recommend.All|60"
 */
function buildTAColumns(timeframes: Timeframe[]): string[] {
  const columns: string[] = ["name"];

  for (const tf of timeframes) {
    columns.push(`Recommend.All|${tf}`);
    columns.push(`Recommend.Other|${tf}`);
    columns.push(`Recommend.MA|${tf}`);
  }

  return columns;
}

/**
 * Parse score: TradingView returns scores in range [-1, 1],
 * where -1 = strong_sell, 0 = neutral, 1 = strong_buy.
 * Sometimes values are null/undefined — treat as neutral.
 */
function parseScore(val: any): number {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  if (isNaN(num)) return 0;
  return Math.max(-1, Math.min(1, num));
}

export class TAClient {
  constructor(
    private client: TradingViewClient,
    private cache: Cache,
    private rateLimiter: RateLimiter
  ) {}

  /**
   * Get TA summary for symbols across timeframes.
   * Uses the scanner API with symbol lookup pattern to get recommendation scores.
   */
  async getTASummary(input: TASummaryInput): Promise<TASummaryResponse> {
    const {
      symbols,
      timeframes = DEFAULT_TIMEFRAMES,
      include_components = true,
    } = input;

    // Validate
    if (!symbols || symbols.length === 0) {
      throw new Error("At least one symbol is required");
    }
    if (symbols.length > 50) {
      throw new Error("Maximum 50 symbols allowed");
    }

    // Validate timeframes
    for (const tf of timeframes) {
      if (!VALID_TIMEFRAMES.includes(tf)) {
        throw new Error(`Invalid timeframe '${tf}'. Valid timeframes: ${VALID_TIMEFRAMES.join(", ")}`);
      }
    }

    // Build cache key
    const cacheKey = JSON.stringify({
      type: "ta_summary",
      symbols: symbols.sort(),
      timeframes,
      include_components,
    });

    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Build columns
    const columns = buildTAColumns(timeframes);

    // Build scanner request using symbol lookup pattern
    const request = {
      filter: [],
      columns,
      sort: { sortBy: "name", sortOrder: "asc" as const },
      range: [0, symbols.length] as [number, number],
      options: { lang: "en" },
      symbols: {
        query: { types: [] },
        tickers: symbols,
      },
    };

    // Rate limit
    await this.rateLimiter.acquire();

    // Make request
    const response = await this.client.scanStocks(request);

    // Parse response
    const results: TASymbolSummary[] = response.data.map((item) => {
      const timeframeData: Record<string, any> = {};

      for (const tf of timeframes) {
        const allIdx = columns.indexOf(`Recommend.All|${tf}`);
        const otherIdx = columns.indexOf(`Recommend.Other|${tf}`);
        const maIdx = columns.indexOf(`Recommend.MA|${tf}`);

        const allScore = allIdx >= 0 ? parseScore(item.d[allIdx]) : 0;
        const otherScore = otherIdx >= 0 ? parseScore(item.d[otherIdx]) : undefined;
        const maScore = maIdx >= 0 ? parseScore(item.d[maIdx]) : undefined;

        timeframeData[tf] = {
          summary: scoreToLabel(allScore),
          scores: include_components
            ? {
                all: allScore,
                ...(otherScore !== undefined ? { oscillators: otherScore } : {}),
                ...(maScore !== undefined ? { moving_averages: maScore } : {}),
              }
            : { all: allScore },
        };
      }

      return {
        symbol: item.s,
        timeframes: timeframeData,
      };
    });

    const result: TASummaryResponse = { symbols: results };
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Rank symbols by weighted TA scores.
   * Composes over getTASummary — thin computation layer.
   */
  async rankByTA(input: RanksByTAInput): Promise<RankByTAResponse> {
    const {
      symbols,
      timeframes = DEFAULT_TIMEFRAMES,
      weights,
    } = input;

    // Default weights: equal weight
    const tfWeights: Record<string, number> = {};
    let totalWeight = 0;
    for (const tf of timeframes) {
      tfWeights[tf] = weights?.[tf] ?? 1;
      totalWeight += tfWeights[tf];
    }

    // Get TA summary
    const summary = await this.getTASummary({
      symbols,
      timeframes,
      include_components: false,
    });

    // Filter to only requested symbols and compute weighted scores
    const requestedSet = new Set(symbols);
    const ranked: RankedSymbol[] = summary.symbols
      .filter((item) => requestedSet.has(item.symbol))
      .map((item) => {
      const breakdown: Record<string, number> = {};
      let weightedSum = 0;

      for (const tf of timeframes) {
        const tfData = item.timeframes[tf];
        const score = tfData?.scores?.all ?? 0;
        breakdown[tf] = score;
        weightedSum += score * tfWeights[tf];
      }

      const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      return {
        symbol: item.symbol,
        score: Math.round(finalScore * 100) / 100,
        label: scoreToLabel(finalScore),
        breakdown,
      };
    });

    // Sort by score descending
    ranked.sort((a, b) => b.score - a.score);

    return {
      requested_symbols: symbols.length,
      timeframes,
      weights: tfWeights,
      ranked,
    };
  }
}