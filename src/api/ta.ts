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
import {
  createResultMetadata,
  withCacheHitMetadata,
  withResultMetadata,
} from "../utils/resultMetadata.js";
import type { ResultMetadata } from "../utils/resultMetadata.js";

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
    available: boolean;
    scores: {
      all: number | null;
      oscillators?: number | null;
      moving_averages?: number | null;
    };
  }>;
}

export interface TASummaryResponse {
  symbols: TASymbolSummary[];
  metadata: ResultMetadata;
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

export interface ExcludedTASymbol {
  symbol: string;
  reason: "missing_symbol" | "unavailable_ta";
}

export interface RankByTAResponse {
  requested_symbols: number;
  timeframes: string[];
  weights: Record<string, number>;
  ranked: RankedSymbol[];
  excluded_symbols: ExcludedTASymbol[];
  metadata: ResultMetadata;
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

function validateTimeframes(timeframes: Timeframe[]): void {
  if (timeframes.length === 0) {
    throw new Error("At least one timeframe is required");
  }

  for (const tf of timeframes) {
    if (!VALID_TIMEFRAMES.includes(tf)) {
      throw new Error(`Invalid timeframe '${tf}'. Valid timeframes: ${VALID_TIMEFRAMES.join(", ")}`);
    }
  }
}

export function validateTAWeights(
  weights: Record<string, number> | undefined,
  timeframes: Timeframe[],
): Record<string, number> {
  const validated: Record<string, number> = {};
  const selectedTimeframes = new Set(timeframes);

  for (const [timeframe, weight] of Object.entries(weights ?? {})) {
    if (!VALID_TIMEFRAMES.includes(timeframe as Timeframe)) {
      throw new Error(`Invalid timeframe '${timeframe}' in weights`);
    }
    if (!selectedTimeframes.has(timeframe as Timeframe)) {
      throw new Error(`weights contains timeframe '${timeframe}' that is not being ranked`);
    }
    if (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0) {
      throw new Error(`weight for timeframe '${timeframe}' must be a finite non-negative number`);
    }
    validated[timeframe] = weight;
  }

  const totalWeight = timeframes.reduce(
    (total, timeframe) => total + (validated[timeframe] ?? 1),
    0,
  );
  if (totalWeight <= 0) {
    throw new Error("weights must assign a positive total weight");
  }

  return validated;
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
 * Parse score. Missing, blank, and non-numeric values stay unavailable rather
 * than becoming a neutral score.
 */
function parseScore(val: unknown): number | null {
  if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
    return null;
  }
  const num = Number(val);
  if (!Number.isFinite(num)) return null;
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
    validateTimeframes(timeframes);

    const cacheSymbols = [...symbols].sort();
    const cacheKey = JSON.stringify({
      type: "ta_summary",
      symbols: cacheSymbols,
      timeframes,
      include_components,
    });
    const source = "https://scanner.tradingview.com/global/scan";

    const cached = this.cache.get(cacheKey);
    if (cached) {
      const cachedSymbols = Array.isArray(cached.symbols)
        ? cached.symbols as TASymbolSummary[]
        : [];
      const cachedUnavailable = cachedSymbols
        .filter((item) => timeframes.every((tf) => item.timeframes[tf]?.available !== true))
        .map((item) => item.symbol);
      return withCacheHitMetadata(cached, {
        source,
        requested_count: symbols.length,
        returned_count: cachedSymbols.length,
        missing_symbols: symbols.filter((symbol) =>
          !cachedSymbols.some((item) => item.symbol === symbol)
        ),
        unavailable_symbols: cachedUnavailable,
      });
    }

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
      const timeframeData: TASymbolSummary["timeframes"] = {};

      for (const tf of timeframes) {
        const allIdx = columns.indexOf(`Recommend.All|${tf}`);
        const otherIdx = columns.indexOf(`Recommend.Other|${tf}`);
        const maIdx = columns.indexOf(`Recommend.MA|${tf}`);

        const allScore = allIdx >= 0 ? parseScore(item.d?.[allIdx]) : null;
        const otherScore = otherIdx >= 0 ? parseScore(item.d?.[otherIdx]) : null;
        const maScore = maIdx >= 0 ? parseScore(item.d?.[maIdx]) : null;
        const available = allScore !== null;

        timeframeData[tf] = {
          summary: available ? scoreToLabel(allScore) : "unavailable",
          available,
          scores: include_components
            ? {
                all: allScore,
                ...(otherIdx >= 0 ? { oscillators: otherScore } : {}),
                ...(maIdx >= 0 ? { moving_averages: maScore } : {}),
              }
            : { all: allScore },
        };
      }

      return {
        symbol: item.s,
        timeframes: timeframeData,
      };
    });
    const returnedSymbols = results.map((item) => item.symbol);
    const unavailableSymbols = results
      .filter((item) => timeframes.every((tf) => item.timeframes[tf]?.available !== true))
      .map((item) => item.symbol);
    const result: TASummaryResponse = withResultMetadata(
      { symbols: results },
      createResultMetadata({
        source,
        requested_count: symbols.length,
        returned_count: results.length,
        missing_symbols: symbols.filter((symbol) => !returnedSymbols.includes(symbol)),
        unavailable_symbols: unavailableSymbols,
      }),
    );
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

    validateTimeframes(timeframes);
    const validatedWeights = validateTAWeights(weights, timeframes);

    const tfWeights: Record<string, number> = {};
    let totalWeight = 0;
    for (const tf of timeframes) {
      tfWeights[tf] = validatedWeights[tf] ?? 1;
      totalWeight += tfWeights[tf];
    }

    // Get TA summary
    const summary = await this.getTASummary({
      symbols,
      timeframes,
      include_components: false,
    });

    const summaryBySymbol = new Map(summary.symbols.map((item) => [item.symbol, item]));
    const ranked: RankedSymbol[] = [];
    const excludedSymbols: ExcludedTASymbol[] = [];

    for (const symbol of symbols) {
      const item = summaryBySymbol.get(symbol);
      if (!item) {
        excludedSymbols.push({ symbol, reason: "missing_symbol" });
        continue;
      }

      const unavailable = timeframes.some((tf) => {
        const timeframeData = item.timeframes[tf];
        return timeframeData?.available !== true || timeframeData.scores.all === null;
      });
      if (unavailable) {
        excludedSymbols.push({ symbol, reason: "unavailable_ta" });
        continue;
      }

      const breakdown: Record<string, number> = {};
      let weightedSum = 0;
      for (const tf of timeframes) {
        const score = item.timeframes[tf].scores.all;
        if (score === null) {
          throw new Error(`TA score became unavailable for ${symbol} on ${tf}`);
        }
        breakdown[tf] = score;
        weightedSum += score * tfWeights[tf];
      }

      const finalScore = weightedSum / totalWeight;
      ranked.push({
        symbol,
        score: Math.round(finalScore * 100) / 100,
        label: scoreToLabel(finalScore),
        breakdown,
      });
    }

    // Sort by score descending
    ranked.sort((a, b) => b.score - a.score);
    const missingSymbols = excludedSymbols
      .filter((item) => item.reason === "missing_symbol")
      .map((item) => item.symbol);
    const unavailableSymbols = excludedSymbols
      .filter((item) => item.reason === "unavailable_ta")
      .map((item) => item.symbol);

    return {
      requested_symbols: symbols.length,
      timeframes,
      weights: tfWeights,
      ranked,
      excluded_symbols: excludedSymbols,
      metadata: createResultMetadata({
        source: "https://scanner.tradingview.com/global/scan",
        cache_hit: summary.metadata.cache_hit,
        requested_count: symbols.length,
        returned_count: ranked.length,
        missing_symbols: missingSymbols,
        unavailable_symbols: unavailableSymbols,
      }),
    };
  }
}