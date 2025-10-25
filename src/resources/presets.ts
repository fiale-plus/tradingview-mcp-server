/**
 * Preset screening configurations
 */

export interface Preset {
  name: string;
  description: string;
  filters: Array<{
    field: string;
    operator: string;
    value: number | string | boolean | [number, number] | string[];
  }>;
  markets?: string[];
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export const PRESETS: Record<string, Preset> = {
  quality_stocks: {
    name: "Quality Stocks (Conservative)",
    description:
      "High-quality, low-volatility stocks with strong fundamentals and uptrends. Based on Avanza conservative screening strategy.",
    filters: [
      { field: "return_on_equity", operator: "greater", value: 12 },
      { field: "market_cap_basic", operator: "greater", value: 200000000 },
      { field: "price_earnings_ttm", operator: "less", value: 40 },
      { field: "price_sales_ratio", operator: "less", value: 8 },
      { field: "debt_to_equity", operator: "less", value: 0.7 },
      { field: "after_tax_margin", operator: "greater", value: 10 },
      { field: "RSI", operator: "in_range", value: [45, 65] },
      { field: "Volatility.M", operator: "less_or_equal", value: 3 },
      { field: "SMA50", operator: "greater", value: "SMA200" },
    ],
    markets: ["america"],
    sort_by: "market_cap_basic",
    sort_order: "desc",
  },

  value_stocks: {
    name: "Value Stocks",
    description: "Undervalued stocks with low P/E and P/B ratios",
    filters: [
      { field: "price_earnings_ttm", operator: "less", value: 15 },
      { field: "price_book_fq", operator: "less", value: 1.5 },
      { field: "market_cap_basic", operator: "greater", value: 1000000000 },
      { field: "return_on_equity", operator: "greater", value: 10 },
    ],
    markets: ["america"],
    sort_by: "price_earnings_ttm",
    sort_order: "asc",
  },

  dividend_stocks: {
    name: "Dividend Stocks",
    description: "High dividend yield with consistent payout",
    filters: [
      { field: "dividend_yield_recent", operator: "greater", value: 3 },
      { field: "market_cap_basic", operator: "greater", value: 5000000000 },
      { field: "debt_to_equity", operator: "less", value: 1.0 },
    ],
    markets: ["america"],
    sort_by: "dividend_yield_recent",
    sort_order: "desc",
  },

  momentum_stocks: {
    name: "Momentum Stocks",
    description: "Stocks with strong recent performance and technical momentum",
    filters: [
      { field: "RSI", operator: "in_range", value: [50, 70] },
      { field: "SMA50", operator: "greater", value: "SMA200" },
      { field: "Perf.1M", operator: "greater", value: 5 },
      { field: "volume", operator: "greater", value: 1000000 },
    ],
    markets: ["america"],
    sort_by: "Perf.1M",
    sort_order: "desc",
  },

  growth_stocks: {
    name: "Growth Stocks",
    description: "High-growth companies with strong revenue and earnings expansion",
    filters: [
      { field: "return_on_equity", operator: "greater", value: 20 },
      { field: "operating_margin", operator: "greater", value: 15 },
      { field: "market_cap_basic", operator: "greater", value: 1000000000 },
    ],
    markets: ["america"],
    sort_by: "return_on_equity",
    sort_order: "desc",
  },

  quality_growth_screener: {
    name: "Quality Growth Screener",
    description: "Comprehensive quality and growth screen: profitable, growing, low-debt companies with strong technicals and exchange filtering. Combines fundamental strength (ROE >15%, margins >12%), growth momentum (revenue +8% YoY), financial stability (low debt, positive FCF), and technical uptrend (golden cross, RSI 45-65, low volatility). Primary listings only on major US exchanges.",
    filters: [
      // Price and Market Cap
      { field: "close", operator: "greater_or_equal", value: 10 },
      { field: "market_cap_basic", operator: "greater_or_equal", value: 2000000000 },

      // Valuation
      { field: "price_earnings_ttm", operator: "less_or_equal", value: 35 },
      { field: "price_sales_current", operator: "less_or_equal", value: 6 },

      // Profitability (Fiscal Quarter/Year data)
      { field: "return_on_equity_fq", operator: "greater", value: 15 },
      { field: "net_margin_fy", operator: "greater", value: 12 },

      // Financial Strength
      { field: "debt_to_equity_fy", operator: "less", value: 0.6 },

      // Growth
      { field: "revenue_per_share_ttm", operator: "greater", value: 3 },
      { field: "total_revenue_yoy_growth_ttm", operator: "greater", value: 8 },

      // Technical Indicators
      { field: "RSI", operator: "in_range", value: [45, 62] },
      { field: "SMA50", operator: "greater_or_equal", value: "SMA200" },
      { field: "close", operator: "greater", value: "SMA50" },
      { field: "Volatility.M", operator: "less", value: 3 },

      // Liquidity
      { field: "average_volume_90d_calc", operator: "greater", value: 200000 },

      // Exchange and Listing Type
      { field: "exchange", operator: "in_range", value: ["NASDAQ", "NYSE", "CBOE"] },
      { field: "is_primary", operator: "equal", value: true },
    ],
    markets: ["america"],
    sort_by: "market_cap_basic",
    sort_order: "desc",
  },
};

export class PresetsTool {
  getPreset(presetName: string): Preset | null {
    return PRESETS[presetName] || null;
  }

  listPresets(): Array<{ name: string; description: string }> {
    return Object.entries(PRESETS).map(([key, preset]) => ({
      name: key,
      description: preset.description,
    }));
  }
}
