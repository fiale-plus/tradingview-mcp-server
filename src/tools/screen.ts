/**
 * Stock screening tool
 */

import type {
  ScreenStocksInput,
  ScreenerRequest,
  Filter,
  FilterOperation,
} from "../api/types.js";
import type { TradingViewClient } from "../api/client.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";

// Operator mapping from MCP to TradingView API
const OPERATOR_MAP: Record<string, FilterOperation> = {
  greater: "greater",
  less: "less",
  greater_or_equal: "egreater",
  less_or_equal: "eless",
  equal: "equal",
  not_equal: "nequal",
  in_range: "in_range",
  not_in_range: "not_in_range",
  crosses: "crosses",
  crosses_above: "crosses_above",
  crosses_below: "crosses_below",
  match: "match",
};

// Minimal default columns for lean responses
const DEFAULT_COLUMNS = [
  "name",
  "close",
  "market_cap_basic",
  "return_on_equity",
  "price_earnings_ttm",
  "debt_to_equity",
  "exchange",
];

// Extended columns for comprehensive analysis
export const EXTENDED_COLUMNS = [
  ...DEFAULT_COLUMNS,
  "free_cash_flow_ttm",
  "free_cash_flow_margin_ttm",
  "earnings_release_next_trading_date_fq",
  "fundamental_currency_code",
  "dividends_yield_current",
  "dividend_payout_ratio_ttm",
  "beta_5_year",
  "sector",
  "industry",
  "earnings_per_share_diluted_yoy_growth_ttm",
];

export class ScreenTool {
  constructor(
    private client: TradingViewClient,
    private cache: Cache,
    private rateLimiter: RateLimiter
  ) {}

  async screenStocks(input: ScreenStocksInput): Promise<any> {
    const {
      filters,
      markets = ["america"],
      sort_by = "market_cap_basic",
      sort_order = "desc",
      limit = 20,
      columns: inputColumns,
    } = input;

    // Validate limit
    if (limit < 1 || limit > 200) {
      throw new Error("Limit must be between 1 and 200");
    }

    // Build cache key
    const cacheKey = JSON.stringify({ filters, markets, sort_by, sort_order, limit, columns: inputColumns });

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Convert filters to TradingView format
    const tvFilters: Filter[] = filters.map((f) => {
      const operation = OPERATOR_MAP[f.operator];
      if (!operation) {
        throw new Error(`Unknown operator: ${f.operator}`);
      }

      return {
        left: f.field,
        operation,
        right: f.value,
      };
    });

    // Extract unique fields from filters for columns
    const filterFields = filters.map((f) => f.field);
    const baseColumns = inputColumns || DEFAULT_COLUMNS;
    const columns = [...new Set([...baseColumns, ...filterFields])];

    // Build request
    const request: ScreenerRequest = {
      filter: tvFilters,
      columns,
      sort: {
        sortBy: sort_by,
        sortOrder: sort_order,
      },
      range: [0, limit],
      options: { lang: "en" },
      symbols: {
        query: { types: [] },
        tickers: [],
      },
      markets,
    };

    // Rate limit
    await this.rateLimiter.acquire();

    // Make request
    const response = await this.client.scanStocks(request);

    // Format response
    const result = {
      total_count: response.totalCount,
      stocks: response.data.map((item) => {
        const stock: Record<string, any> = { symbol: item.s };

        columns.forEach((col, idx) => {
          stock[col] = item.d[idx];
        });

        return stock;
      }),
    };

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  async screenForex(input: Omit<ScreenStocksInput, "markets">): Promise<any> {
    // Similar to screenStocks but without markets
    const {
      filters,
      sort_by = "volume",
      sort_order = "desc",
      limit = 20,
    } = input;

    const cacheKey = JSON.stringify({ type: "forex", filters, sort_by, sort_order, limit });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const tvFilters: Filter[] = filters.map((f) => {
      const operation = OPERATOR_MAP[f.operator];
      if (!operation) {
        throw new Error(`Unknown operator: ${f.operator}`);
      }

      return {
        left: f.field,
        operation,
        right: f.value,
      };
    });

    const filterFields = filters.map((f) => f.field);
    const columns = [...new Set(["name", "close", "change", ...filterFields])];

    const request: ScreenerRequest = {
      filter: tvFilters,
      columns,
      sort: { sortBy: sort_by, sortOrder: sort_order },
      range: [0, limit],
      options: { lang: "en" },
      symbols: { query: { types: [] }, tickers: [] },
    };

    await this.rateLimiter.acquire();
    const response = await this.client.scanForex(request);

    const result = {
      total_count: response.totalCount,
      pairs: response.data.map((item) => {
        const pair: Record<string, any> = { symbol: item.s };
        columns.forEach((col, idx) => { pair[col] = item.d[idx]; });
        return pair;
      }),
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  async screenCrypto(input: Omit<ScreenStocksInput, "markets">): Promise<any> {
    // Similar to forex
    const {
      filters,
      sort_by = "market_cap_basic",
      sort_order = "desc",
      limit = 20,
    } = input;

    const cacheKey = JSON.stringify({ type: "crypto", filters, sort_by, sort_order, limit });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const tvFilters: Filter[] = filters.map((f) => {
      const operation = OPERATOR_MAP[f.operator];
      if (!operation) {
        throw new Error(`Unknown operator: ${f.operator}`);
      }

      return {
        left: f.field,
        operation,
        right: f.value,
      };
    });

    const filterFields = filters.map((f) => f.field);
    const columns = [...new Set(["name", "close", "market_cap_basic", "change", ...filterFields])];

    const request: ScreenerRequest = {
      filter: tvFilters,
      columns,
      sort: { sortBy: sort_by, sortOrder: sort_order },
      range: [0, limit],
      options: { lang: "en" },
      symbols: { query: { types: [] }, tickers: [] },
    };

    await this.rateLimiter.acquire();
    const response = await this.client.scanCrypto(request);

    const result = {
      total_count: response.totalCount,
      cryptocurrencies: response.data.map((item) => {
        const crypto: Record<string, any> = { symbol: item.s };
        columns.forEach((col, idx) => { crypto[col] = item.d[idx]; });
        return crypto;
      }),
    };

    this.cache.set(cacheKey, result);
    return result;
  }
}
