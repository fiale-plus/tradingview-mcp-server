/**
 * Field listing and metadata
 */

import type { FieldMetadata, ListFieldsInput } from "../api/types.js";

// Common stock fields
const STOCK_FIELDS: FieldMetadata[] = [
  // Fundamental
  {
    name: "market_cap_basic",
    label: "Market Capitalization",
    category: "fundamental",
    type: "currency",
    description: "Total market value of company",
  },
  {
    name: "return_on_equity",
    label: "Return on Equity (TTM)",
    category: "fundamental",
    type: "percent",
    description: "Profitability relative to shareholder equity",
  },
  {
    name: "return_on_equity_fq",
    label: "Return on Equity (FQ)",
    category: "fundamental",
    type: "percent",
    description: "Profitability relative to shareholder equity (fiscal quarter)",
  },
  {
    name: "price_earnings_ttm",
    label: "P/E Ratio (TTM)",
    category: "fundamental",
    type: "number",
    description: "Price to earnings ratio",
  },
  {
    name: "price_book_fq",
    label: "P/B Ratio",
    category: "fundamental",
    type: "number",
    description: "Price to book value ratio",
  },
  {
    name: "price_sales_ratio",
    label: "P/S Ratio",
    category: "fundamental",
    type: "number",
    description: "Price to sales ratio",
  },
  {
    name: "price_sales_current",
    label: "P/S Ratio (Current)",
    category: "fundamental",
    type: "number",
    description: "Current price to sales ratio",
  },
  {
    name: "debt_to_equity",
    label: "Debt/Equity Ratio",
    category: "fundamental",
    type: "number",
    description: "Total debt relative to shareholder equity",
  },
  {
    name: "debt_to_equity_fy",
    label: "Debt/Equity Ratio (FY)",
    category: "fundamental",
    type: "number",
    description: "Total debt relative to shareholder equity (fiscal year)",
  },
  {
    name: "net_margin_ttm",
    label: "Net Margin (TTM)",
    category: "fundamental",
    type: "percent",
    description: "Net income as percentage of revenue",
  },
  {
    name: "net_margin_fy",
    label: "Net Margin (FY)",
    category: "fundamental",
    type: "percent",
    description: "Net income as percentage of revenue (fiscal year)",
  },
  {
    name: "after_tax_margin",
    label: "After-Tax Margin",
    category: "fundamental",
    type: "percent",
    description: "Profit margin after taxes",
  },
  {
    name: "operating_margin",
    label: "Operating Margin",
    category: "fundamental",
    type: "percent",
    description: "Operating income as percentage of revenue",
  },
  {
    name: "operating_margin_ttm",
    label: "Operating Margin (TTM)",
    category: "fundamental",
    type: "percent",
    description: "Operating income as percentage of revenue (trailing twelve months)",
  },
  {
    name: "gross_margin",
    label: "Gross Margin",
    category: "fundamental",
    type: "percent",
    description: "Gross profit as percentage of revenue",
  },
  {
    name: "gross_margin_ttm",
    label: "Gross Margin (TTM)",
    category: "fundamental",
    type: "percent",
    description: "Gross profit as percentage of revenue (trailing twelve months)",
  },
  {
    name: "pre_tax_margin_ttm",
    label: "Pre-Tax Margin (TTM)",
    category: "fundamental",
    type: "percent",
    description: "Pre-tax profit as percentage of revenue (trailing twelve months)",
  },
  {
    name: "return_on_assets",
    label: "Return on Assets",
    category: "fundamental",
    type: "percent",
    description: "Net income relative to total assets",
  },
  {
    name: "return_on_assets_fq",
    label: "Return on Assets (FQ)",
    category: "fundamental",
    type: "percent",
    description: "Net income relative to total assets (fiscal quarter)",
  },
  {
    name: "return_on_invested_capital_fq",
    label: "Return on Invested Capital (FQ)",
    category: "fundamental",
    type: "percent",
    description: "Return on total invested capital (fiscal quarter)",
  },
  {
    name: "research_and_dev_ratio_ttm",
    label: "R&D Ratio (TTM)",
    category: "fundamental",
    type: "percent",
    description: "Research and development expenses as percentage of revenue (trailing twelve months)",
  },
  {
    name: "sell_gen_admin_exp_other_ratio_ttm",
    label: "SG&A Ratio (TTM)",
    category: "fundamental",
    type: "percent",
    description: "Selling, general and administrative expenses as percentage of revenue (trailing twelve months)",
  },
  {
    name: "total_assets",
    label: "Total Assets",
    category: "fundamental",
    type: "currency",
    description: "Total company assets",
  },
  {
    name: "total_debt",
    label: "Total Debt",
    category: "fundamental",
    type: "currency",
    description: "Total company debt",
  },
  {
    name: "current_ratio",
    label: "Current Ratio",
    category: "fundamental",
    type: "number",
    description: "Current assets divided by current liabilities (liquidity measure)",
  },
  {
    name: "enterprise_value_current",
    label: "Enterprise Value",
    category: "fundamental",
    type: "currency",
    description: "Market cap plus debt minus cash",
  },
  {
    name: "enterprise_value_to_ebit_ttm",
    label: "EV/EBIT (TTM)",
    category: "fundamental",
    type: "number",
    description: "Enterprise value to EBIT ratio (trailing twelve months)",
  },
  {
    name: "enterprise_value_ebitda_ttm",
    label: "EV/EBITDA (TTM)",
    category: "fundamental",
    type: "number",
    description: "Enterprise value to EBITDA ratio (trailing twelve months)",
  },
  {
    name: "price_earnings_growth_ttm",
    label: "PEG Ratio (TTM)",
    category: "fundamental",
    type: "number",
    description: "Price/earnings to growth ratio (trailing twelve months)",
  },
  {
    name: "ebitda",
    label: "EBITDA",
    category: "fundamental",
    type: "currency",
    description: "Earnings before interest, taxes, depreciation and amortization",
  },
  {
    name: "dividend_yield_recent",
    label: "Dividend Yield",
    category: "fundamental",
    type: "percent",
    description: "Annual dividend as percentage of price",
  },
  {
    name: "dividends_yield_current",
    label: "Dividend Yield (Current/TTM)",
    category: "fundamental",
    type: "percent",
    description: "Current dividend yield (trailing twelve months)",
  },
  {
    name: "dividends_yield_fq",
    label: "Dividend Yield (FQ)",
    category: "fundamental",
    type: "percent",
    description: "Dividend yield (fiscal quarter)",
  },
  {
    name: "dividends_yield_fy",
    label: "Dividend Yield (FY)",
    category: "fundamental",
    type: "percent",
    description: "Dividend yield (fiscal year)",
  },
  {
    name: "dividend_payout_ratio_ttm",
    label: "Dividend Payout Ratio (TTM)",
    category: "fundamental",
    type: "percent",
    description: "Percentage of earnings paid as dividends (trailing twelve months)",
  },
  {
    name: "dividend_payout_ratio_fy",
    label: "Dividend Payout Ratio (FY)",
    category: "fundamental",
    type: "percent",
    description: "Percentage of earnings paid as dividends (fiscal year)",
  },
  {
    name: "earnings_per_share_diluted_ttm",
    label: "EPS (Diluted, TTM)",
    category: "fundamental",
    type: "currency",
    description: "Earnings per share",
  },
  {
    name: "total_revenue",
    label: "Total Revenue",
    category: "fundamental",
    type: "currency",
    description: "Total company revenue",
  },
  {
    name: "net_income",
    label: "Net Income",
    category: "fundamental",
    type: "currency",
    description: "Total net profit",
  },
  {
    name: "revenue_per_share_ttm",
    label: "Revenue per Share (TTM)",
    category: "fundamental",
    type: "currency",
    description: "Total revenue divided by shares outstanding",
  },
  {
    name: "total_revenue_yoy_growth_ttm",
    label: "Revenue Growth YoY (TTM)",
    category: "fundamental",
    type: "percent",
    description: "Year-over-year revenue growth rate",
  },
  {
    name: "free_cash_flow_ttm",
    label: "Free Cash Flow (TTM)",
    category: "fundamental",
    type: "currency",
    description: "Cash generated after capital expenditures (trailing 12 months)",
  },
  {
    name: "free_cash_flow_fq",
    label: "Free Cash Flow (FQ)",
    category: "fundamental",
    type: "currency",
    description: "Cash generated after capital expenditures (fiscal quarter)",
  },
  {
    name: "free_cash_flow_fy",
    label: "Free Cash Flow (FY)",
    category: "fundamental",
    type: "currency",
    description: "Cash generated after capital expenditures (fiscal year)",
  },
  {
    name: "free_cash_flow_margin_ttm",
    label: "FCF Margin (TTM)",
    category: "fundamental",
    type: "percent",
    description: "Free cash flow as percentage of revenue (trailing 12 months)",
  },
  {
    name: "free_cash_flow_margin_fy",
    label: "FCF Margin (FY)",
    category: "fundamental",
    type: "percent",
    description: "Free cash flow as percentage of revenue (fiscal year)",
  },
  {
    name: "earnings_release_next_trading_date_fq",
    label: "Next Earnings Date",
    category: "fundamental",
    type: "string",
    description: "Upcoming earnings announcement date (fiscal quarter)",
  },
  {
    name: "fundamental_currency_code",
    label: "Currency Code",
    category: "fundamental",
    type: "string",
    description: "Currency code for fundamental data (e.g., USD, EUR)",
  },
  {
    name: "earnings_per_share_diluted_yoy_growth_ttm",
    label: "EPS Diluted Growth YoY (TTM)",
    category: "fundamental",
    type: "percent",
    description: "Year-over-year growth in diluted earnings per share",
  },
  {
    name: "sector",
    label: "Sector",
    category: "fundamental",
    type: "string",
    description: "Business sector",
  },
  {
    name: "sector.tr",
    label: "Sector (Translated)",
    category: "fundamental",
    type: "string",
    description: "Business sector (translated)",
  },
  {
    name: "industry",
    label: "Industry",
    category: "fundamental",
    type: "string",
    description: "Business industry",
  },
  {
    name: "industry.tr",
    label: "Industry (Translated)",
    category: "fundamental",
    type: "string",
    description: "Business industry (translated)",
  },
  {
    name: "market",
    label: "Market",
    category: "fundamental",
    type: "string",
    description: "Market identifier",
  },

  // Technical
  {
    name: "RSI",
    label: "RSI (14)",
    category: "technical",
    type: "number",
    description: "Relative Strength Index momentum oscillator",
  },
  {
    name: "SMA50",
    label: "SMA 50",
    category: "technical",
    type: "number",
    description: "50-day Simple Moving Average",
  },
  {
    name: "SMA200",
    label: "SMA 200",
    category: "technical",
    type: "number",
    description: "200-day Simple Moving Average",
  },
  {
    name: "EMA10",
    label: "EMA 10",
    category: "technical",
    type: "number",
    description: "10-day Exponential Moving Average",
  },
  {
    name: "Volatility.M",
    label: "Volatility (Monthly)",
    category: "technical",
    type: "percent",
    description: "1-month price volatility",
  },
  {
    name: "ATR",
    label: "Average True Range",
    category: "technical",
    type: "number",
    description: "Measure of volatility",
  },
  {
    name: "ADX",
    label: "ADX",
    category: "technical",
    type: "number",
    description: "Average Directional Index",
  },
  {
    name: "beta_1_year",
    label: "Beta (1 Year)",
    category: "technical",
    type: "number",
    description: "Stock volatility relative to market (1 year period)",
  },
  {
    name: "beta_3_year",
    label: "Beta (3 Year)",
    category: "technical",
    type: "number",
    description: "Stock volatility relative to market (3 year period)",
  },
  {
    name: "beta_5_year",
    label: "Beta (5 Year)",
    category: "technical",
    type: "number",
    description: "Stock volatility relative to market (5 year period)",
  },

  // Performance
  {
    name: "close",
    label: "Current Price",
    category: "performance",
    type: "currency",
    description: "Current stock price",
  },
  {
    name: "change",
    label: "Change %",
    category: "performance",
    type: "percent",
    description: "Daily price change percentage",
  },
  {
    name: "volume",
    label: "Volume",
    category: "performance",
    type: "number",
    description: "Trading volume",
  },
  {
    name: "average_volume_90d_calc",
    label: "Average Volume (90D)",
    category: "performance",
    type: "number",
    description: "90-day average trading volume",
  },
  {
    name: "Perf.W",
    label: "Weekly Performance",
    category: "performance",
    type: "percent",
    description: "1-week price change",
  },
  {
    name: "Perf.1M",
    label: "Monthly Performance",
    category: "performance",
    type: "percent",
    description: "1-month price change",
  },
  {
    name: "Perf.3M",
    label: "3-Month Performance",
    category: "performance",
    type: "percent",
    description: "3-month price change",
  },
  {
    name: "Perf.Y",
    label: "Yearly Performance",
    category: "performance",
    type: "percent",
    description: "1-year price change",
  },
  {
    name: "Perf.YTD",
    label: "YTD Performance",
    category: "performance",
    type: "percent",
    description: "Year-to-date price change",
  },

  // Metadata fields
  {
    name: "exchange",
    label: "Exchange",
    category: "performance",
    type: "string",
    description: "Stock exchange (e.g., NASDAQ, NYSE, CBOE)",
  },
  {
    name: "is_primary",
    label: "Is Primary Listing",
    category: "performance",
    type: "boolean",
    description: "Whether this is the primary listing for the security",
  },
];

export class FieldsTool {
  listFields(input: ListFieldsInput): any {
    const { asset_type = "stock", category } = input;

    // For MVP, only stock fields are implemented
    if (asset_type !== "stock") {
      return {
        message: `Fields for ${asset_type} will be available in future versions`,
        fields: [],
      };
    }

    let fields = STOCK_FIELDS;

    // Filter by category if specified
    if (category) {
      fields = fields.filter((f) => f.category === category);
    }

    return {
      asset_type,
      category: category || "all",
      field_count: fields.length,
      fields,
    };
  }
}
