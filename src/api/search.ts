/**
 * TradingView Symbol Search API
 *
 * Uses the public symbol-search endpoint to find symbols by query.
 * Endpoint: GET https://symbol-search.tradingview.com/symbol_search/v3
 */

import fetch from "node-fetch";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json");

const SEARCH_BASE = "https://symbol-search.tradingview.com";
const SEARCH_TIMEOUT = 10000; // 10 seconds

export interface SearchSymbolResult {
  symbol: string;
  ticker: string;
  description: string;
  exchange: string;
  type: string;
  currency?: string;
}

export interface SearchSymbolsInput {
  query: string;
  exchange?: string;
  asset_type?: "stock" | "forex" | "crypto" | "cfd" | "futures" | "index" | "economic";
  limit?: number;
  start?: number;
}

export interface SearchSymbolsResponse {
  query: string;
  count: number;
  symbols: SearchSymbolResult[];
}

interface NormalizedSearchResults {
  count: number;
  symbols: SearchSymbolResult[];
}

/**
 * Map TradingView type strings to normalized asset types
 */
const TYPE_MAP: Record<string, string> = {
  stock: "stock",
  forex: "forex",
  crypto: "crypto",
  cfd: "cfd",
  futures: "futures",
  index: "index",
  economic: "economic",
  dr: "stock",     // depositary receipts → stock
  etf: "etf",
  fund: "etf",
  bond: "bond",
};

function inferAssetType(item: any): string {
  const rawType = item.type?.toLowerCase() || "";
  const exchange = (item.exchange || item.exchange_name || "").toLowerCase();

  if (rawType === "spot" || exchange === "crypto") return "crypto";
  if (rawType === "fund" || rawType === "etf") return "etf";
  if (rawType === "dr") return "stock";
  if (rawType === "bond") return "bond";

  return TYPE_MAP[rawType] || rawType || "unknown";
}

export function filterSearchResults(
  rawResults: any[],
  assetType?: SearchSymbolsInput["asset_type"]
): any[] {
  if (!assetType) {
    return rawResults;
  }

  return rawResults.filter((item) => inferAssetType(item) === assetType);
}

export function normalizeSearchResults(
  rawResults: any[],
  start: number,
  limit: number
): NormalizedSearchResults {
  const totalMatches = rawResults.length;

  // Strip HTML emphasis tags from TradingView highlighting
  const stripTags = (s: string) => s.replace(/<\/?em>/g, "");

  const symbols: SearchSymbolResult[] = rawResults
    .slice(start, start + limit)
    .map((item: any) => {
      const exchangeName = item.exchange || item.exchange_name || "";
      const tickerName = item.ticker || item.symbol || "";
      const fullSymbol = exchangeName && tickerName && !tickerName.includes(":")
        ? `${exchangeName}:${tickerName}`
        : tickerName;

      return {
        symbol: stripTags(fullSymbol),
        ticker: stripTags(tickerName),
        description: stripTags(item.description || item.name || ""),
        exchange: stripTags(exchangeName),
        type: TYPE_MAP[item.type?.toLowerCase() || ""] || item.type?.toLowerCase() || "unknown",
        currency: item.currency || item.currency_code || undefined,
      };
    });

  return {
    count: totalMatches,
    symbols,
  };
}

export class SearchClient {
  /**
   * Search for symbols on TradingView.
   */
  async searchSymbols(input: SearchSymbolsInput): Promise<SearchSymbolsResponse> {
    const { query, exchange, asset_type, limit = 20, start = 0 } = input;

    // Validate query
    if (!query || query.trim().length < 1) {
      throw new Error("Query must be at least 1 character");
    }

    // Validate limit
    const clampedLimit = Math.min(Math.max(limit, 1), 50);

    // Build URL
    const params = new URLSearchParams({
      text: query.trim(),
      hl: "true",
      exchange: exchange || "",
    });

    const url = `${SEARCH_BASE}/symbol_search/v3/?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": `tradingview-mcp-server/${pkg.version}`,
          "Origin": "https://www.tradingview.com",
          "Referer": "https://www.tradingview.com/",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Symbol search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;

      // TradingView symbol search v3 returns an array of results
      // Each result has: symbol, type, exchange, description, currency, etc.
      const rawResults: any[] = Array.isArray(data) ? data : (data.symbols || data.results || []);
      const filteredResults = filterSearchResults(rawResults, asset_type);
      const normalized = normalizeSearchResults(filteredResults, start, clampedLimit);

      return {
        query: query.trim(),
        count: normalized.count,
        symbols: normalized.symbols,
      };
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === "AbortError") {
        throw new Error("Symbol search request timeout");
      }
      throw error;
    }
  }
}
