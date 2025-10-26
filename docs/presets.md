# Preset Screening Strategies

> **Disclaimer:** This guide provides educational information about screening strategies. It is not investment advice. All investment decisions are your responsibility. See the [full disclaimer](../README.md#disclaimer) for details.

## Learn Time-Tested Investment Approaches

These 6 pre-configured strategies represent proven investment philosophies used by successful investors for decades. Each preset is designed to help you **explore different investment styles systematically** - from conservative quality investing to growth-oriented strategies.

### Why Presets Matter for Learning Investors

Instead of reinventing the wheel or relying on tips, these presets give you:

1. **Structured frameworks** - Learn what metrics matter for each investment style
2. **Systematic research** - Understand how professional investors screen opportunities
3. **Risk-appropriate approaches** - Match strategies to your risk tolerance and timeline
4. **Educational foundation** - Build investment knowledge through practical application

Each preset codifies the criteria that define an investment approach - quality, value, growth, income, or momentum. By exploring results from different presets, you learn to recognize patterns and develop your investment thesis.

**These are starting points for research, not buy signals.** Use them to build watchlists, understand company characteristics, and develop conviction before investing.

---

## Table of Contents

- [Overview](#overview)
- [Quality Stocks (Conservative)](#quality-stocks-conservative)
- [Value Stocks](#value-stocks)
- [Dividend Stocks](#dividend-stocks)
- [Momentum Stocks](#momentum-stocks)
- [Growth Stocks](#growth-stocks)
- [Quality Growth Screener (Comprehensive)](#quality-growth-screener-comprehensive)
- [Usage](#usage)
- [Performance Characteristics](#performance-characteristics)

## Overview

Presets can be accessed via:
- **Tool**: `get_preset` - Returns the preset configuration
- **Tool**: `list_presets` - Lists all available presets
- **Resource**: `preset://preset_name` - Access via MCP resources

Each preset is designed for a specific investment strategy and returns different column sets based on the analysis depth required.

---

## Quality Stocks (Conservative)

**Preset ID:** `quality_stocks`

High-quality, low-volatility stocks with strong fundamentals and uptrends. Conservative screening strategy ideal for risk-averse investors seeking stable, well-managed companies.

### Criteria

| Category | Filter | Value |
|----------|--------|-------|
| **Profitability** | ROE | > 12% |
| **Size** | Market Cap | > $200M |
| **Valuation** | P/E (TTM) | < 40 |
| **Valuation** | P/S | < 8 |
| **Financial Health** | Debt/Equity | < 0.7 |
| **Margins** | After-Tax Margin | > 10% |
| **Technical** | RSI | 45-65 (neutral zone) |
| **Risk** | Monthly Volatility | ≤ 3% |
| **Trend** | SMA50 vs SMA200 | Golden Cross (50 > 200) |

### Configuration

```javascript
{
  markets: ["america"],
  sort_by: "market_cap_basic",
  sort_order: "desc",
  columns: "default" // 7 minimal fields
}
```

### Returns

Default minimal columns (7 fields) for fast screening with lean payload.

### Best For

- **Learning quality investing** - Understand what makes a "quality" company (strong ROE, low debt, stable margins)
- **Conservative portfolios** - Lower volatility suits risk-averse or long-term investors
- **Building conviction** - Research fundamentally sound companies before investing
- **First portfolio holdings** - Stable companies suitable for new investors learning the ropes

---

## Value Stocks

**Preset ID:** `value_stocks`

Undervalued stocks trading below intrinsic value with solid fundamentals. Focuses on traditional value metrics like P/E and P/B ratios.

### Criteria

| Category | Filter | Value |
|----------|--------|-------|
| **Valuation** | P/E (TTM) | < 15 |
| **Valuation** | P/B (FQ) | < 1.5 |
| **Size** | Market Cap | > $1B |
| **Profitability** | ROE | > 10% |

### Configuration

```javascript
{
  markets: ["america"],
  sort_by: "price_earnings_ttm",
  sort_order: "asc", // Lowest P/E first
  columns: "default" // 7 minimal fields
}
```

### Returns

Default minimal columns (7 fields).

### Best For

- **Learning value investing** - Explore Warren Buffett's approach of finding undervalued companies
- **Patient investors** - Value stocks often take time to be recognized by the market
- **Contrarian research** - Find companies temporarily out of favor but fundamentally sound
- **Understanding valuation** - Learn why P/E and P/B matter for finding bargains

---

## Dividend Stocks

**Preset ID:** `dividend_stocks`

Income-focused stocks with high dividend yields and financial stability. Emphasizes sustainable payouts from large-cap companies.

### Criteria

| Category | Filter | Value |
|----------|--------|-------|
| **Income** | Dividend Yield | > 3% |
| **Size** | Market Cap | > $5B |
| **Financial Health** | Debt/Equity | < 1.0 |

### Configuration

```javascript
{
  markets: ["america"],
  sort_by: "dividend_yield_recent",
  sort_order: "desc", // Highest yield first
  columns: "default" // 7 minimal fields
}
```

### Returns

Default minimal columns (7 fields).

### Best For

- **Learning income investing** - Understand how dividends provide cash flow and stability
- **Building passive income** - Research companies with sustainable dividend payments
- **Compound wealth** - Explore dividend reinvestment (DRIP) strategies
- **Retirement planning** - Identify stable income sources for long-term portfolios

---

## Momentum Stocks

**Preset ID:** `momentum_stocks`

Stocks showing strong technical momentum and recent performance. Captures trending stocks with strong volume.

### Criteria

| Category | Filter | Value |
|----------|--------|-------|
| **Technical** | RSI | 50-70 (bullish zone) |
| **Trend** | SMA50 vs SMA200 | Golden Cross (50 > 200) |
| **Performance** | 1-Month Return | > 5% |
| **Liquidity** | Volume | > 1M shares |

### Configuration

```javascript
{
  markets: ["america"],
  sort_by: "Perf.1M",
  sort_order: "desc", // Best performers first
  columns: "default" // 7 minimal fields
}
```

### Returns

Default minimal columns (7 fields).

### Best For

- **Understanding momentum** - Learn how technical indicators identify trending stocks
- **Medium-term positions** - Hold winners for weeks to months (not intraday trading)
- **Combining technical + fundamental** - See how price action confirms fundamental strength
- **Risk management practice** - Study how to ride trends and manage position exits

---

## Growth Stocks

**Preset ID:** `growth_stocks`

High-growth companies with strong profitability and margins. Focuses on operational efficiency and return metrics.

### Criteria

| Category | Filter | Value |
|----------|--------|-------|
| **Profitability** | ROE | > 20% |
| **Efficiency** | Operating Margin | > 15% |
| **Size** | Market Cap | > $1B |

### Configuration

```javascript
{
  markets: ["america"],
  sort_by: "return_on_equity",
  sort_order: "desc", // Highest ROE first
  columns: "default" // 7 minimal fields
}
```

### Returns

Default minimal columns (7 fields).

### Best For

- **Learning growth investing** - Understand Peter Lynch's approach of finding great businesses
- **High-conviction research** - Deep dive into companies with exceptional returns and margins
- **Long-term compounding** - Identify businesses that can grow for years or decades
- **Developing conviction** - Build understanding before making concentrated bets

---

## Quality Growth Screener (Comprehensive)

**Preset ID:** `quality_growth_screener`

The most comprehensive preset combining fundamental strength, growth momentum, financial stability, and technical uptrend. Primary listings only on major US exchanges (NASDAQ, NYSE, CBOE).

**Returns 35 extended columns** including enterprise value metrics, margins (gross, operating, pre-tax), returns (ROA, ROIC), balance sheet data, and R&D ratios for deep fundamental analysis.

### 16-Filter Criteria

#### Price & Size
- **Price** ≥ $10
- **Market Cap** ≥ $2B

#### Valuation
- **P/E (TTM)** ≤ 35
- **P/S (Current)** ≤ 6

#### Profitability (FQ/FY)
- **ROE (FQ)** > 15%
- **Net Margin (FY)** > 12%

#### Financial Strength
- **Debt/Equity (FY)** < 0.6

#### Growth
- **Revenue/Share (TTM)** > $3
- **Revenue Growth YoY** > 8%

#### Technical Indicators
- **RSI** between 45-62 (neutral to slightly bullish)
- **Golden Cross**: SMA50 ≥ SMA200
- **Price Position**: Close > SMA50 (above trend)
- **Monthly Volatility** < 3%

#### Liquidity & Quality
- **90-day Avg Volume** > 200K shares
- **Exchange**: NASDAQ, NYSE, or CBOE only
- **Primary Listing** only (eliminates duplicates like ADRs)

### Configuration

```javascript
{
  markets: ["america"],
  sort_by: "market_cap_basic",
  sort_order: "desc",
  columns: [
    // Default 7
    "name", "close", "market_cap_basic", "return_on_equity",
    "price_earnings_ttm", "debt_to_equity", "exchange",

    // Cash flow & margins (5)
    "free_cash_flow_ttm", "free_cash_flow_margin_ttm",
    "gross_margin", "gross_margin_ttm", "operating_margin_ttm",
    "pre_tax_margin_ttm",

    // Returns & efficiency (3)
    "return_on_assets", "return_on_assets_fq",
    "return_on_invested_capital_fq",

    // Balance sheet (3)
    "total_assets", "total_debt", "current_ratio",

    // Valuation (5)
    "enterprise_value_current", "enterprise_value_to_ebit_ttm",
    "enterprise_value_ebitda_ttm", "price_earnings_growth_ttm", "ebitda",

    // Operating metrics (2)
    "research_and_dev_ratio_ttm", "sell_gen_admin_exp_other_ratio_ttm",

    // Earnings & growth (2)
    "earnings_release_next_trading_date_fq",
    "earnings_per_share_diluted_yoy_growth_ttm",

    // Dividends (2)
    "dividends_yield_current", "dividend_payout_ratio_ttm",

    // Risk & classification (6)
    "beta_1_year", "beta_5_year", "sector", "industry",
    "fundamental_currency_code"
  ] // 35 extended fields total
}
```

### Returns

**35 extended columns** organized in categories:
- **Core metrics** (7): name, price, market cap, ROE, P/E, D/E, exchange
- **Margins** (6): FCF, FCF margin, gross, operating, pre-tax margins
- **Returns** (3): ROA, ROA (FQ), ROIC
- **Balance sheet** (3): assets, debt, current ratio
- **Valuation** (5): EV, EV/EBIT, EV/EBITDA, PEG, EBITDA
- **Operating** (2): R&D ratio, SG&A ratio
- **Growth** (2): next earnings date, EPS growth
- **Dividends** (2): yield, payout ratio
- **Risk** (6): beta (1Y/5Y), sector, industry, currency

### Best For

- **Deep fundamental research** - Access 35 metrics to thoroughly understand a business
- **Learning advanced analysis** - Study enterprise value, ROIC, margins, and cash flow metrics
- **Portfolio construction** - Build high-conviction positions with comprehensive data
- **QARP strategies** - Master quality-at-reasonable-price investing (Buffett + Lynch combined)
- **Long-term investing education** - Understand what metrics predict sustainable competitive advantages

### Typical Results

Typically finds **6-11 stocks globally** (6 in US markets with exchange filters) that meet all 16 criteria. These are high-quality companies with:
- Strong fundamentals (ROE >15%, margins >12%)
- Reasonable valuations (P/E <35, P/S <6)
- Healthy balance sheets (low debt)
- Growth momentum (revenue growing >8%)
- Technical strength (uptrend, low volatility)

---

## Usage

### Via Tool

```javascript
// Get a preset
const preset = await get_preset({ preset_name: "quality_growth_screener" });

// Screen using the preset
const results = await screen_stocks({
  filters: preset.filters,
  markets: preset.markets,
  sort_by: preset.sort_by,
  sort_order: preset.sort_order,
  columns: preset.columns,
  limit: 20
});
```

### Via Natural Language (Claude)

```
Find quality growth stocks using the comprehensive screener preset
```

```
Show me dividend stocks sorted by yield
```

```
Screen for value stocks with P/E under 15
```

---

## Performance Characteristics

### Payload Sizes

| Preset | Columns Returned | Payload Size | Use Case |
|--------|------------------|--------------|----------|
| `quality_stocks` | 7 default | ~1.5 KB/stock | Quick screening |
| `value_stocks` | 7 default | ~1.5 KB/stock | Quick screening |
| `dividend_stocks` | 7 default | ~1.5 KB/stock | Quick screening |
| `momentum_stocks` | 7 default | ~1.5 KB/stock | Quick screening |
| `growth_stocks` | 7 default | ~1.5 KB/stock | Quick screening |
| `quality_growth_screener` | 35 extended | ~7.5 KB/stock | Deep analysis |

### Column Sets

**Default Columns (7 fields):**
- `name`, `close`, `market_cap_basic`, `return_on_equity`, `price_earnings_ttm`, `debt_to_equity`, `exchange`

**Extended Columns (35 fields):**
- All default fields + 28 comprehensive fields for deep fundamental analysis

### Performance Tips

1. **Use default presets** for quick scans and large result sets
2. **Use quality_growth_screener** when you need comprehensive analysis
3. **Adjust limit** parameter based on columns returned (fewer columns = larger limit feasible)
4. **Cache results** - presets are cached for 5 minutes by default

---

## See Also

- [Field Reference](fields.md) - Complete list of all 75+ available fields
- [Development Guide](development.md) - How to create custom presets
- [Quick Start Guide](../README.md#quick-start) - Custom screening examples

---

**Smarter screens, not faster trades.**
