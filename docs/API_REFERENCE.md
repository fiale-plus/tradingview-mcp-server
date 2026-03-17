# TradingView MCP Server — API Reference

This document is the complete reference for all MCP tools, operators, fields, presets, and Claude commands exposed by the TradingView MCP Server.

---

## Tools

### screen_stocks

Screen stocks based on fundamental and technical criteria. Returns stocks matching the specified filters.

**Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filters` | `Filter[]` | No | `[]` | Array of filter conditions to apply |
| `markets` | `string[]` | No | `["america"]` | Markets to scan (see Markets section) |
| `sort_by` | `string` | No | `"market_cap_basic"` | Field to sort results by |
| `sort_order` | `"asc" \| "desc"` | No | `"desc"` | Sort direction |
| `limit` | `number` | No | `20` | Number of results (1–200) |
| `columns` | `string[]` | No | DEFAULT_COLUMNS | Specific columns to include in results |

**Filter object**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `field` | `string` | Yes | Field name to filter on. String fields (sector, exchange, industry, market) support `equal` and `in_range`. Cross-field comparison: use another field name as value (e.g., `SMA50 crosses_above SMA200`). |
| `operator` | `string` | Yes | One of the 18 supported operators (see Operators section) |
| `value` | `number \| string \| [number, number] \| string[]` | Conditional | Not required for `empty` and `not_empty` operators. Use array `[min, max]` for `in_range`. |

**Default columns:** `name`, `close`, `market_cap_basic`, `return_on_equity`, `price_earnings_ttm`, `debt_to_equity`, `exchange`

**Supported markets:** america, uk, germany, france, italy, spain, sweden, norway, denmark, finland, brazil, india, japan, hongkong, china, australia, canada, turkey, uae, and 30+ more.

**Examples**

```json
// Golden cross screen
{
  "filters": [
    {"field": "SMA50", "operator": "crosses_above", "value": "SMA200"},
    {"field": "volume", "operator": "greater", "value": 1000000}
  ],
  "markets": ["america"],
  "sort_by": "market_cap_basic",
  "limit": 20
}
```

```json
// Value stocks in Technology sector
{
  "filters": [
    {"field": "sector", "operator": "equal", "value": "Technology"},
    {"field": "price_earnings_ttm", "operator": "less", "value": 25},
    {"field": "return_on_equity", "operator": "greater", "value": 15}
  ]
}
```

---

### screen_forex

Screen forex pairs based on technical criteria. Returns forex pairs matching the specified filters.

**Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filters` | `Filter[]` | No | `[]` | Array of filter conditions to apply |
| `sort_by` | `string` | No | `"volume"` | Field to sort results by |
| `sort_order` | `"asc" \| "desc"` | No | `"desc"` | Sort direction |
| `limit` | `number` | No | `20` | Number of results (1–200) |
| `columns` | `string[]` | No | `["name","close","change"]` | Columns to include |

Note: `markets` parameter is not available for forex — all pairs are scanned globally.

**Common fields:** `RSI`, `ATR`, `ADX`, `close`, `change`, `volume`, `SMA50`, `SMA200`, `Perf.W`, `Perf.1M`, `Perf.3M`

**Example**

```json
{
  "filters": [
    {"field": "RSI", "operator": "in_range", "value": [40, 60]},
    {"field": "ADX", "operator": "greater", "value": 25}
  ],
  "sort_by": "volume",
  "limit": 10
}
```

---

### screen_crypto

Screen cryptocurrencies based on technical and market criteria. Returns cryptocurrencies matching the specified filters.

**Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filters` | `Filter[]` | No | `[]` | Array of filter conditions to apply |
| `sort_by` | `string` | No | `"market_cap_basic"` | Field to sort results by |
| `sort_order` | `"asc" \| "desc"` | No | `"desc"` | Sort direction |
| `limit` | `number` | No | `20` | Number of results (1–200) |
| `columns` | `string[]` | No | `["name","close","market_cap_basic","change"]` | Columns to include |

Note: `markets` parameter is not available for crypto.

**Common fields:** `market_cap_basic`, `RSI`, `close`, `change`, `volume`, `Perf.1M`, `Perf.3M`, `Volatility.M`

**Example**

```json
{
  "filters": [
    {"field": "market_cap_basic", "operator": "greater", "value": 1000000000},
    {"field": "RSI", "operator": "in_range", "value": [40, 70]},
    {"field": "Perf.1M", "operator": "greater", "value": 10}
  ],
  "sort_by": "market_cap_basic",
  "limit": 20
}
```

---

### screen_etf

Screen ETFs (Exchange-Traded Funds) based on performance and technical criteria. Returns ETFs matching the specified filters.

**Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filters` | `Filter[]` | No | `[]` | Array of filter conditions to apply |
| `markets` | `string[]` | No | `["america"]` | Markets to scan |
| `sort_by` | `string` | No | `"market_cap_basic"` | Field to sort results by (market_cap_basic approximates AUM for ETFs) |
| `sort_order` | `"asc" \| "desc"` | No | `"desc"` | Sort direction |
| `limit` | `number` | No | `20` | Number of results (1–200) |
| `columns` | `string[]` | No | `["name","close","volume","change","change_from_open"]` | Columns to include |

Note: Internally applies a `type = fund` filter in addition to user-supplied filters.

**Example**

```json
{
  "filters": [
    {"field": "Perf.Y", "operator": "greater", "value": 15},
    {"field": "expense_ratio", "operator": "less", "value": 0.2}
  ],
  "sort_by": "Perf.Y",
  "sort_order": "desc",
  "limit": 10
}
```

---

### lookup_symbols

Look up specific symbols (stocks, indexes, ETFs) by ticker. Use this for direct symbol lookup including market indexes like `TVC:SPX`, `TVC:DJI`, `OMXSTO:OMXS30` that cannot be found via screening. Returns comprehensive data including ATH, 52-week highs/lows.

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | `string[]` | Yes | Array of ticker symbols (max 100). Use format `EXCHANGE:TICKER` e.g. `NASDAQ:AAPL`, `TVC:SPX`. |
| `columns` | `string[]` | No | Specific columns. Default: `name`, `close`, `change`, `volume`, `market_cap_basic`, `all_time_high`, `all_time_low`, `price_52_week_high`, `price_52_week_low` |

**Example**

```json
{
  "symbols": ["TVC:SPX", "TVC:DJI", "TVC:IXIC", "TVC:RUT"],
  "columns": ["name", "close", "change", "all_time_high", "RSI", "Perf.Y"]
}
```

**Use cases**
- Market indexes (TVC:SPX, TVC:DJI, TVC:DAX, OMXSTO:OMXS30, etc.)
- Direct lookup by ticker when you know the exact symbol
- Fetching ATH and 52-week high/low data
- Macro assets: TVC:VIX, TVC:DXY, TVC:TNX, TVC:GOLD, TVC:USOIL, CRYPTOCAP:BTC

---

### list_fields

List available fields for filtering and display. Use this to discover what fields you can filter and sort by.

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `asset_type` | `"stock" \| "forex" \| "crypto" \| "etf"` | No | Type of asset. Default: `"stock"` |
| `category` | `"fundamental" \| "technical" \| "performance"` | No | Filter by category. If omitted, returns all categories. |

**Return format**

```json
{
  "asset_type": "stock",
  "category": "all",
  "field_count": 75,
  "fields": [
    {
      "name": "return_on_equity",
      "label": "Return on Equity (TTM)",
      "category": "fundamental",
      "type": "percent",
      "description": "Profitability relative to shareholder equity"
    }
  ]
}
```

---

### get_preset

Get a pre-configured screening strategy. Returns the full filter configuration for the strategy.

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `preset_name` | `string` | Yes | Key of the preset to retrieve (see Presets section for all keys) |

**Return format**

Returns the full preset object including `filters`, `markets`, `sort_by`, `sort_order`, and optionally `symbols` (for symbol-based presets like indexes) and `columns`.

---

### list_presets

List all available preset screening strategies. Returns key, name, and description for each preset.

**Parameters:** None

**Return format**

```json
[
  {
    "key": "quality_stocks",
    "name": "Quality Stocks (Conservative)",
    "description": "High-quality, low-volatility stocks..."
  }
]
```

---

## Operators

All 18 operators supported by the filter system:

| Operator | TradingView Operation | Value Type | Description | Example |
|----------|-----------------------|------------|-------------|---------|
| `greater` | `greater` | number | Field > value | `{"field": "return_on_equity", "operator": "greater", "value": 15}` |
| `less` | `less` | number | Field < value | `{"field": "price_earnings_ttm", "operator": "less", "value": 20}` |
| `greater_or_equal` | `egreater` | number | Field >= value | `{"field": "market_cap_basic", "operator": "greater_or_equal", "value": 1000000000}` |
| `less_or_equal` | `eless` | number | Field <= value | `{"field": "Volatility.M", "operator": "less_or_equal", "value": 3}` |
| `equal` | `equal` | string / number / boolean | Field = value | `{"field": "sector", "operator": "equal", "value": "Technology"}` |
| `not_equal` | `nequal` | string / number | Field != value | `{"field": "industry", "operator": "not_equal", "value": "Real Estate Investment Trusts"}` |
| `in_range` | `in_range` | `[min, max]` or `string[]` | Field between min and max (inclusive), or field matches any string in array | `{"field": "RSI", "operator": "in_range", "value": [40, 70]}` |
| `not_in_range` | `not_in_range` | `[min, max]` | Field outside min–max range | `{"field": "price_earnings_ttm", "operator": "not_in_range", "value": [0, 5]}` |
| `crosses` | `crosses` | string (field name) | Field crosses another field (either direction) | `{"field": "EMA10", "operator": "crosses", "value": "SMA50"}` |
| `crosses_above` | `crosses_above` | string (field name) | Field crosses above another field (bullish) | `{"field": "SMA50", "operator": "crosses_above", "value": "SMA200"}` |
| `crosses_below` | `crosses_below` | string (field name) | Field crosses below another field (bearish) | `{"field": "SMA50", "operator": "crosses_below", "value": "SMA200"}` |
| `match` | `match` | string | String pattern match | `{"field": "sector", "operator": "match", "value": "Tech"}` |
| `above_percent` | `above%` | number | Field is X% above another field | `{"field": "close", "operator": "above_percent", "value": 5}` |
| `below_percent` | `below%` | number | Field is X% below another field | `{"field": "close", "operator": "below_percent", "value": 10}` |
| `has` | `has` | string / string[] | Field contains value (for set/list fields) | `{"field": "indexes", "operator": "has", "value": "S&P 500"}` |
| `has_none_of` | `has_none_of` | string[] | Field contains none of the given values | `{"field": "indexes", "operator": "has_none_of", "value": ["S&P 500"]}` |
| `empty` | `empty` | (none) | Field is null/empty — no value required | `{"field": "earnings_release_next_trading_date_fq", "operator": "empty"}` |
| `not_empty` | `nempty` | (none) | Field is not null/empty — no value required | `{"field": "dividend_yield_recent", "operator": "not_empty"}` |

**Notes on operator usage:**
- `in_range` with a string array acts as an "in" filter, e.g. `{"field": "exchange", "operator": "in_range", "value": ["NASDAQ", "NYSE"]}` returns stocks on either exchange.
- Cross-field operators (`crosses`, `crosses_above`, `crosses_below`) require the `value` to be another field name (string), not a number.
- `empty` and `not_empty` require no `value` property.
- `above_percent` and `below_percent` are percentage-based relative comparisons.

---

## Fields

### Stock Fields (~75 fields)

#### Fundamental

| Name | Label | Type | Description |
|------|-------|------|-------------|
| `market_cap_basic` | Market Capitalization | currency | Total market value of company |
| `return_on_equity` | Return on Equity (TTM) | percent | Profitability relative to shareholder equity |
| `return_on_equity_fq` | Return on Equity (FQ) | percent | Profitability relative to shareholder equity (fiscal quarter) |
| `price_earnings_ttm` | P/E Ratio (TTM) | number | Price to earnings ratio |
| `price_book_fq` | P/B Ratio | number | Price to book value ratio |
| `price_sales_ratio` | P/S Ratio | number | Price to sales ratio |
| `price_sales_current` | P/S Ratio (Current) | number | Current price to sales ratio |
| `debt_to_equity` | Debt/Equity Ratio | number | Total debt relative to shareholder equity |
| `debt_to_equity_fy` | Debt/Equity Ratio (FY) | number | Total debt relative to shareholder equity (fiscal year) |
| `net_margin_ttm` | Net Margin (TTM) | percent | Net income as percentage of revenue |
| `net_margin_fy` | Net Margin (FY) | percent | Net income as percentage of revenue (fiscal year) |
| `after_tax_margin` | After-Tax Margin | percent | Profit margin after taxes |
| `operating_margin` | Operating Margin | percent | Operating income as percentage of revenue |
| `operating_margin_ttm` | Operating Margin (TTM) | percent | Operating income as percentage of revenue (trailing twelve months) |
| `gross_margin` | Gross Margin | percent | Gross profit as percentage of revenue |
| `gross_margin_ttm` | Gross Margin (TTM) | percent | Gross profit as percentage of revenue (trailing twelve months) |
| `pre_tax_margin_ttm` | Pre-Tax Margin (TTM) | percent | Pre-tax profit as percentage of revenue (trailing twelve months) |
| `return_on_assets` | Return on Assets | percent | Net income relative to total assets |
| `return_on_assets_fq` | Return on Assets (FQ) | percent | Net income relative to total assets (fiscal quarter) |
| `return_on_invested_capital_fq` | Return on Invested Capital (FQ) | percent | Return on total invested capital (fiscal quarter) |
| `research_and_dev_ratio_ttm` | R&D Ratio (TTM) | percent | R&D expenses as percentage of revenue (trailing twelve months) |
| `sell_gen_admin_exp_other_ratio_ttm` | SG&A Ratio (TTM) | percent | SG&A expenses as percentage of revenue (trailing twelve months) |
| `total_assets` | Total Assets | currency | Total company assets |
| `total_debt` | Total Debt | currency | Total company debt |
| `current_ratio` | Current Ratio | number | Current assets / current liabilities (liquidity measure) |
| `enterprise_value_current` | Enterprise Value | currency | Market cap plus debt minus cash |
| `enterprise_value_to_ebit_ttm` | EV/EBIT (TTM) | number | Enterprise value to EBIT ratio (trailing twelve months) |
| `enterprise_value_ebitda_ttm` | EV/EBITDA (TTM) | number | Enterprise value to EBITDA ratio (trailing twelve months) |
| `price_earnings_growth_ttm` | PEG Ratio (TTM) | number | Price/earnings to growth ratio (trailing twelve months) |
| `ebitda` | EBITDA | currency | Earnings before interest, taxes, depreciation and amortization |
| `dividend_yield_recent` | Dividend Yield | percent | Annual dividend as percentage of price |
| `dividends_yield_current` | Dividend Yield (Current/TTM) | percent | Current dividend yield (trailing twelve months) |
| `dividends_yield_fq` | Dividend Yield (FQ) | percent | Dividend yield (fiscal quarter) |
| `dividends_yield_fy` | Dividend Yield (FY) | percent | Dividend yield (fiscal year) |
| `dividend_payout_ratio_ttm` | Dividend Payout Ratio (TTM) | percent | Percentage of earnings paid as dividends (trailing twelve months) |
| `dividend_payout_ratio_fy` | Dividend Payout Ratio (FY) | percent | Percentage of earnings paid as dividends (fiscal year) |
| `earnings_per_share_diluted_ttm` | EPS (Diluted, TTM) | currency | Earnings per share |
| `total_revenue` | Total Revenue | currency | Total company revenue |
| `net_income` | Net Income | currency | Total net profit |
| `revenue_per_share_ttm` | Revenue per Share (TTM) | currency | Total revenue divided by shares outstanding |
| `total_revenue_yoy_growth_ttm` | Revenue Growth YoY (TTM) | percent | Year-over-year revenue growth rate |
| `free_cash_flow_ttm` | Free Cash Flow (TTM) | currency | Cash generated after capital expenditures (trailing 12 months) |
| `free_cash_flow_fq` | Free Cash Flow (FQ) | currency | Cash generated after capital expenditures (fiscal quarter) |
| `free_cash_flow_fy` | Free Cash Flow (FY) | currency | Cash generated after capital expenditures (fiscal year) |
| `free_cash_flow_margin_ttm` | FCF Margin (TTM) | percent | Free cash flow as percentage of revenue (trailing 12 months) |
| `free_cash_flow_margin_fy` | FCF Margin (FY) | percent | Free cash flow as percentage of revenue (fiscal year) |
| `earnings_release_next_trading_date_fq` | Next Earnings Date | string | Upcoming earnings announcement date (fiscal quarter) |
| `fundamental_currency_code` | Currency Code | string | Currency code for fundamental data (e.g., USD, EUR) |
| `earnings_per_share_diluted_yoy_growth_ttm` | EPS Diluted Growth YoY (TTM) | percent | Year-over-year growth in diluted earnings per share |
| `sector` | Sector | string | Business sector |
| `sector.tr` | Sector (Translated) | string | Business sector (translated) |
| `industry` | Industry | string | Business industry |
| `industry.tr` | Industry (Translated) | string | Business industry (translated) |
| `market` | Market | string | Market identifier |
| `piotroski_f_score_ttm` | Piotroski F-Score | number | Composite financial strength score 0–9. ≥7 = strong, ≤2 = weak. Tests profitability, leverage, operating efficiency. |
| `altman_z_score_ttm` | Altman Z-Score | number | Bankruptcy risk predictor. >2.99 = safe zone, 1.81–2.99 = grey zone, <1.81 = distress zone. |
| `graham_numbers_ttm` | Graham Number | currency | Intrinsic value estimate = sqrt(22.5 × EPS × BVPS). Price below Graham Number suggests undervaluation. |
| `Recommend.All` | Analyst Recommendation (Composite) | number | Composite from 26 indicators: -1=Strong Sell, -0.5=Sell, 0=Neutral, 0.5=Buy, 1=Strong Buy. |
| `analyst_recommendations_buy` | Analyst Buy Ratings | number | Number of analyst Buy/Strong Buy recommendations. |
| `analyst_recommendations_sell` | Analyst Sell Ratings | number | Number of analyst Sell/Strong Sell recommendations. |
| `analyst_recommendations_neutral` | Analyst Hold Ratings | number | Number of analyst Hold/Neutral recommendations. |
| `price_target_average` | Analyst Price Target (Average) | currency | Average analyst 12-month price target. |
| `price_target_high` | Analyst Price Target (High) | currency | Highest analyst 12-month price target. |
| `price_target_low` | Analyst Price Target (Low) | currency | Lowest analyst 12-month price target. |
| `continuous_dividend_payout_years` | Consecutive Dividend Years | number | Number of consecutive years paying dividends. Dividend Aristocrats have ≥25 years. |
| `dps_yoy_growth_ttm` | Dividend Growth YoY (TTM) | percent | Year-over-year growth in dividends per share. |
| `indexes` | Index Membership | string | Indexes this security belongs to (e.g., S&P 500, Nasdaq 100). Use `has` operator for filtering. |

#### Technical

| Name | Label | Type | Description |
|------|-------|------|-------------|
| `RSI` | RSI (14) | number | Relative Strength Index momentum oscillator |
| `SMA50` | SMA 50 | number | 50-day Simple Moving Average |
| `SMA200` | SMA 200 | number | 200-day Simple Moving Average |
| `EMA10` | EMA 10 | number | 10-day Exponential Moving Average |
| `Volatility.M` | Volatility (Monthly) | percent | 1-month price volatility |
| `ATR` | Average True Range | number | Measure of volatility |
| `ADX` | ADX | number | Average Directional Index |
| `beta_1_year` | Beta (1 Year) | number | Stock volatility relative to market (1 year period) |
| `beta_3_year` | Beta (3 Year) | number | Stock volatility relative to market (3 year period) |
| `beta_5_year` | Beta (5 Year) | number | Stock volatility relative to market (5 year period) |
| `VWAP` | VWAP | currency | Volume Weighted Average Price — average price weighted by volume. |
| `Recommend.MA` | Moving Average Recommendation | number | Moving average composite signal: -1=Strong Sell to 1=Strong Buy. |
| `Recommend.Other` | Oscillator Recommendation | number | Oscillator composite signal: -1=Strong Sell to 1=Strong Buy. |

#### Performance

| Name | Label | Type | Description |
|------|-------|------|-------------|
| `close` | Current Price | currency | Current stock price |
| `change` | Change % | percent | Daily price change percentage |
| `volume` | Volume | number | Trading volume |
| `average_volume_90d_calc` | Average Volume (90D) | number | 90-day average trading volume |
| `average_volume_30d_calc` | Average Volume (30D) | number | 30-day average trading volume. |
| `relative_volume_10d_calc` | Relative Volume (10D) | number | Today's volume relative to 10-day average. >1.5 = elevated activity. |
| `Perf.5D` | 5-Day Performance | percent | 5-day price change percentage. |
| `Perf.W` | Weekly Performance | percent | 1-week price change |
| `Perf.1M` | Monthly Performance | percent | 1-month price change |
| `Perf.3M` | 3-Month Performance | percent | 3-month price change |
| `Perf.6M` | 6-Month Performance | percent | 6-month price change percentage. |
| `Perf.Y` | Yearly Performance | percent | 1-year price change |
| `Perf.YTD` | YTD Performance | percent | Year-to-date price change |
| `Perf.3Y` | 3-Year Performance | percent | 3-year price change percentage. |
| `Perf.5Y` | 5-Year Performance | percent | 5-year price change percentage. |
| `Perf.10Y` | 10-Year Performance | percent | 10-year price change percentage. |
| `Perf.All` | All-Time Performance | percent | All-time price change from IPO. |
| `price_52_week_high` | 52-Week High | currency | Highest price in past 52 weeks. |
| `price_52_week_low` | 52-Week Low | currency | Lowest price in past 52 weeks. |
| `all_time_high` | All-Time High | currency | All-time highest price. |
| `all_time_low` | All-Time Low | currency | All-time lowest price. |
| `High.All` | % From All-Time High | percent | Percentage below all-time high (negative = below ATH). |
| `exchange` | Exchange | string | Stock exchange (e.g., NASDAQ, NYSE, CBOE) |
| `is_primary` | Is Primary Listing | boolean | Whether this is the primary listing for the security |

---

### ETF Fields (15 fields)

| Name | Label | Category | Type | Description |
|------|-------|----------|------|-------------|
| `market_cap_basic` | AUM (approx) | fundamental | currency | Total assets under management (approximate) |
| `expense_ratio` | Expense Ratio | fundamental | percent | Annual fund operating expense as % of assets |
| `shares_outstanding` | Shares Outstanding | fundamental | number | Total number of ETF shares outstanding |
| `dividends_yield_current` | Distribution Yield | fundamental | percent | Current distribution yield |
| `exchange` | Exchange | performance | string | Listed exchange |
| `close` | Price (NAV) | performance | currency | Current ETF price / NAV |
| `change` | Change % | performance | percent | Daily price change |
| `volume` | Volume | performance | number | Trading volume |
| `Perf.W` | Weekly Performance | performance | percent | 1-week return |
| `Perf.1M` | Monthly Performance | performance | percent | 1-month return |
| `Perf.3M` | 3-Month Performance | performance | percent | 3-month return |
| `Perf.Y` | Yearly Performance | performance | percent | 1-year return |
| `Perf.YTD` | YTD Performance | performance | percent | Year-to-date return |
| `RSI` | RSI (14) | technical | number | Relative Strength Index |
| `ATR` | Average True Range | technical | number | Volatility measure |

---

### Crypto Fields (11 fields)

| Name | Label | Category | Type | Description |
|------|-------|----------|------|-------------|
| `close` | Price (USD) | performance | currency | Current price in USD |
| `change` | Change % | performance | percent | 24h price change |
| `volume` | 24h Volume | performance | currency | 24-hour trading volume |
| `Perf.W` | Weekly Performance | performance | percent | 7-day price change |
| `Perf.1M` | Monthly Performance | performance | percent | 30-day price change |
| `Perf.3M` | 3-Month Performance | performance | percent | 90-day price change |
| `Perf.Y` | Yearly Performance | performance | percent | 1-year price change |
| `RSI` | RSI (14) | technical | number | Relative Strength Index |
| `ATR` | Average True Range | technical | number | Volatility measure |
| `Volatility.M` | Monthly Volatility | technical | percent | 30-day price volatility |
| `market_cap_basic` | Market Cap | fundamental | currency | Total market capitalization (available for major coins on centralized exchanges) |

---

### Forex Fields (12 fields)

| Name | Label | Category | Type | Description |
|------|-------|----------|------|-------------|
| `close` | Exchange Rate | performance | number | Current exchange rate |
| `change` | Change % | performance | percent | Daily rate change |
| `volume` | Volume | performance | number | Trading volume |
| `Perf.W` | Weekly Performance | performance | percent | 7-day rate change |
| `Perf.1M` | Monthly Performance | performance | percent | 30-day rate change |
| `Perf.3M` | 3-Month Performance | performance | percent | 90-day rate change |
| `RSI` | RSI (14) | technical | number | Relative Strength Index |
| `ATR` | Average True Range (ATR) | technical | number | Volatility measure |
| `ADX` | ADX | technical | number | Average Directional Index (trend strength) |
| `Volatility.D` | Daily Volatility | technical | percent | Daily price volatility |
| `SMA50` | SMA 50 | technical | number | 50-period Simple Moving Average |
| `SMA200` | SMA 200 | technical | number | 200-period Simple Moving Average |

---

## Presets

14 pre-configured screening strategies accessible via `get_preset` / `list_presets`:

| Key | Name | Type | Markets | Sort By | Description |
|-----|------|------|---------|---------|-------------|
| `quality_stocks` | Quality Stocks (Conservative) | filter | america | market_cap_basic desc | High-quality, low-volatility stocks with strong fundamentals and uptrends. |
| `value_stocks` | Value Stocks | filter | america | price_earnings_ttm asc | Undervalued stocks with low P/E and P/B ratios. |
| `dividend_stocks` | Dividend Stocks | filter | america | dividend_yield_recent desc | High dividend yield with consistent payout. |
| `momentum_stocks` | Momentum Stocks | filter | america | Perf.1M desc | Strong recent performance and technical momentum. |
| `growth_stocks` | Growth Stocks | filter | america | return_on_equity desc | High-growth companies with strong revenue and earnings expansion. |
| `quality_growth_screener` | Quality Growth Screener | filter | america | market_cap_basic desc | Comprehensive quality+growth screen: profitable, growing, low-debt companies with golden cross and RSI filters. Primary listings on major US exchanges. |
| `quality_compounder` | Quality Compounders (Munger/Buffett) | filter | america | return_on_invested_capital_fq desc | Durable competitive advantage compounders: gross margin >40%, ROIC >15%, FCF margin >15%, growing revenue, low debt. |
| `garp` | GARP (Growth at Reasonable Price) | filter | america | price_earnings_growth_ttm asc | PEG-based screen combining growth and value: PEG <2, ROE >15%, revenue growth >10%, reasonable debt. |
| `deep_value` | Deep Value (Contrarian) | filter | america | price_book_fq asc | Classic deep value: P/E <10, P/B <1.5, positive earnings and FCF. |
| `breakout_scanner` | Breakout Scanner | filter | america | Perf.1M desc | Technical breakout: stocks near 52-week highs, above SMA200, RSI momentum zone, above-average volume. |
| `earnings_momentum` | Earnings Momentum | filter | america | earnings_per_share_diluted_yoy_growth_ttm desc | Strong earnings momentum: high EPS growth YoY, positive RSI, above SMA50, large cap. |
| `dividend_growth` | Dividend Growth (Compounding Income) | filter | america | dividend_yield_recent desc | Dividend growth investing: consistent payers with growing dividends, strong FCF, moderate yield. |
| `macro_assets` | Macro Asset Monitor | symbols | — | — | Key macro assets: VIX, DXY, TNX (10Y yield), Gold, Oil, Bitcoin, SPX. |
| `market_indexes` | Global Market Indexes | symbols | — | — | Major global indexes: US (SPX, DJI, IXIC, RUT), European (UKX, DAX, CAC, IBEX35), Asian (NI225, HSI, SHCOMP, SENSEX), Nordic (OMXS30). Includes ATH, 52-week data, and performance. |

### Preset filter details

**quality_stocks** filters:
- `return_on_equity > 12`
- `market_cap_basic > 200M`
- `price_earnings_ttm < 40`
- `price_sales_ratio < 8`
- `debt_to_equity < 0.7`
- `after_tax_margin > 10`
- `RSI in_range [45, 65]`
- `Volatility.M <= 3`
- `SMA50 > SMA200` (golden cross)

**quality_growth_screener** filters (most comprehensive):
- Price ≥ $10, Market cap ≥ $2B
- P/E ≤ 35, P/S ≤ 6
- ROE (FQ) > 15%, Net margin (FY) > 12%
- Debt/equity (FY) < 0.6
- Revenue per share (TTM) > $3, Revenue growth YoY > 8%
- RSI in [45, 62], SMA50 ≥ SMA200, price > SMA50, Volatility.M < 3
- Average 90D volume > 200K
- Exchange: NASDAQ, NYSE, or CBOE; primary listing only
- Uses EXTENDED_COLUMNS for comprehensive output

**macro_assets** symbols: `TVC:VIX`, `TVC:DXY`, `TVC:TNX`, `TVC:GOLD`, `TVC:USOIL`, `CRYPTOCAP:BTC`, `TVC:SPX`

**market_indexes** symbols: `TVC:SPX`, `TVC:DJI`, `TVC:IXIC`, `TVC:RUT`, `TVC:UKX`, `TVC:DAX`, `TVC:CAC`, `TVC:IBEX35`, `TVC:NI225`, `TVC:HSI`, `TVC:SHCOMP`, `BSE:SENSEX`, `OMXSTO:OMXS30`

---

## Filter Examples

### 1. Golden Cross Screen
Stocks where the 50-day SMA has recently crossed above the 200-day SMA.
```json
{
  "filters": [
    {"field": "SMA50", "operator": "crosses_above", "value": "SMA200"},
    {"field": "market_cap_basic", "operator": "greater", "value": 1000000000},
    {"field": "volume", "operator": "greater", "value": 1000000}
  ]
}
```

### 2. High Piotroski F-Score
Financially strong companies using the Piotroski composite score.
```json
{
  "filters": [
    {"field": "piotroski_f_score_ttm", "operator": "greater_or_equal", "value": 7},
    {"field": "market_cap_basic", "operator": "greater", "value": 500000000}
  ]
}
```

### 3. Strong Analyst Buy Consensus
Stocks with a composite analyst recommendation near Strong Buy.
```json
{
  "filters": [
    {"field": "Recommend.All", "operator": "greater_or_equal", "value": 0.5},
    {"field": "analyst_recommendations_buy", "operator": "greater", "value": 5},
    {"field": "market_cap_basic", "operator": "greater", "value": 2000000000}
  ]
}
```

### 4. Dividend Aristocrat Candidates
Long-term consistent dividend payers with growing payouts.
```json
{
  "filters": [
    {"field": "continuous_dividend_payout_years", "operator": "greater_or_equal", "value": 25},
    {"field": "dividend_payout_ratio_ttm", "operator": "less", "value": 70},
    {"field": "free_cash_flow_ttm", "operator": "greater", "value": 0}
  ]
}
```

### 5. Breakout Setup
Stocks near 52-week highs with above-average volume, suggesting breakout momentum.
```json
{
  "filters": [
    {"field": "RSI", "operator": "in_range", "value": [55, 75]},
    {"field": "SMA50", "operator": "greater", "value": "SMA200"},
    {"field": "close", "operator": "greater", "value": "SMA50"},
    {"field": "relative_volume_10d_calc", "operator": "greater", "value": 1.5},
    {"field": "exchange", "operator": "in_range", "value": ["NASDAQ", "NYSE"]}
  ]
}
```

### 6. Deep Value (Contrarian)
Classic value metrics: low P/E, low P/B, positive earnings and free cash flow.
```json
{
  "filters": [
    {"field": "price_earnings_ttm", "operator": "in_range", "value": [1, 10]},
    {"field": "price_book_fq", "operator": "less", "value": 1.5},
    {"field": "return_on_equity", "operator": "greater", "value": 5},
    {"field": "free_cash_flow_ttm", "operator": "greater", "value": 0}
  ],
  "sort_by": "price_book_fq",
  "sort_order": "asc"
}
```

### 7. GARP (Growth at Reasonable Price)
PEG ratio combines growth rate with valuation to find reasonably-priced growth stocks.
```json
{
  "filters": [
    {"field": "price_earnings_growth_ttm", "operator": "in_range", "value": [0.1, 2.0]},
    {"field": "return_on_equity", "operator": "greater", "value": 15},
    {"field": "total_revenue_yoy_growth_ttm", "operator": "greater", "value": 10},
    {"field": "debt_to_equity", "operator": "less", "value": 1.5}
  ],
  "sort_by": "price_earnings_growth_ttm"
}
```

### 8. Quality Compounder
High ROIC, strong gross margins, and positive FCF for buy-and-hold investors.
```json
{
  "filters": [
    {"field": "gross_margin_ttm", "operator": "greater", "value": 40},
    {"field": "return_on_invested_capital_fq", "operator": "greater", "value": 15},
    {"field": "free_cash_flow_margin_ttm", "operator": "greater", "value": 15},
    {"field": "total_revenue_yoy_growth_ttm", "operator": "greater", "value": 5},
    {"field": "debt_to_equity", "operator": "less", "value": 0.8}
  ],
  "sort_by": "return_on_invested_capital_fq",
  "sort_order": "desc"
}
```

### 9. Sector-Specific Screen (Technology, Large Cap)
Filter by sector string, then apply fundamental criteria.
```json
{
  "filters": [
    {"field": "sector", "operator": "equal", "value": "Technology"},
    {"field": "market_cap_basic", "operator": "greater", "value": 10000000000},
    {"field": "gross_margin_ttm", "operator": "greater", "value": 50},
    {"field": "RSI", "operator": "less", "value": 60}
  ],
  "sort_by": "market_cap_basic",
  "sort_order": "desc"
}
```

### 10. Empty/Not-Empty Field Check
Use `not_empty` to find stocks with upcoming earnings dates, or `empty` to find those without.
```json
{
  "filters": [
    {"field": "earnings_release_next_trading_date_fq", "operator": "not_empty"},
    {"field": "market_cap_basic", "operator": "greater", "value": 1000000000}
  ],
  "sort_by": "market_cap_basic"
}
```

---

## Claude Commands

9 ready-to-use slash commands in `.claude/commands/`:

| Command | Description |
|---------|-------------|
| `/market-regime` | Analyze Nasdaq Composite, OMX Stockholm 30, and Nikkei 225 relative to their all-time highs. Displays drawdown table with green/amber/red regime status. |
| `/run-screener` | Interactive stock screening: lists presets, prompts for selection, runs the screen, displays summary table, saves results to CSV in `docs/local/screening-runs/`. |
| `/smart-screen` | Automatically determines market regime (bull/correction/bear) from SPX data, selects the best preset, and runs the screener — no input required. |
| `/macro-dashboard` | Multi-asset macro snapshot: US and global equity indexes, VIX, DXY, 10Y yield, Gold, Oil, and Bitcoin. Includes signal interpretations and market narrative. |
| `/sector-rotation` | Cross-sector performance ranking across all 11 GICS sectors. Identifies leading/lagging sectors and preset recommendations based on rotation signals. |
| `/due-diligence` | Structured due diligence report for a single stock: valuation, quality, growth, balance sheet, dividends, technical, performance, and checklist assessment. Usage: `/due-diligence AAPL` |
| `/compare-peers` | Side-by-side comparison of 2–5 stocks across valuation, quality, growth, momentum, and safety. Rankings and summary per investment style. Usage: `/compare-peers AAPL MSFT GOOGL` |
| `/portfolio-risk` | Portfolio concentration and risk analysis: sector breakdown, beta, volatility, and overall risk profile. Usage: `/portfolio-risk AAPL MSFT GOOGL JPM XOM` |
| `/investment-thesis` | Data-driven investment thesis: bull case, bear case, key metrics table, technical setup, entry/exit framework, and monitoring checklist. Usage: `/investment-thesis AAPL` |

---

## Configuration

Environment variables (set in `.mcp.json`):

| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_TTL_SECONDS` | `300` | Cache duration in seconds for API responses |
| `RATE_LIMIT_RPM` | `10` | Maximum API requests per minute |

---

## Response Formats

### screen_stocks / screen_etf response
```json
{
  "total_count": 142,
  "stocks": [
    {
      "symbol": "NASDAQ:AAPL",
      "name": "Apple Inc",
      "close": 185.92,
      "market_cap_basic": 2870000000000,
      "return_on_equity": 147.3,
      "price_earnings_ttm": 29.8,
      "debt_to_equity": 1.96,
      "exchange": "NASDAQ"
    }
  ]
}
```

### screen_forex response
```json
{
  "total_count": 28,
  "pairs": [
    {"symbol": "FX:EURUSD", "name": "EUR/USD", "close": 1.0852, "change": 0.12}
  ]
}
```

### screen_crypto response
```json
{
  "total_count": 50,
  "cryptocurrencies": [
    {"symbol": "CRYPTOCAP:BTC", "name": "Bitcoin", "close": 68400, "market_cap_basic": 1350000000000, "change": 2.1}
  ]
}
```

### lookup_symbols response
```json
{
  "total_count": 4,
  "symbols": [
    {
      "symbol": "TVC:SPX",
      "name": "S&P 500 Index",
      "close": 5732.93,
      "change": 0.38,
      "all_time_high": 5878.46,
      "price_52_week_high": 5878.46,
      "price_52_week_low": 4835.04
    }
  ]
}
```
