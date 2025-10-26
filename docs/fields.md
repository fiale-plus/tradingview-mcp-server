# Field Reference

## Understanding Investment Metrics

This reference helps you **learn what financial metrics mean** and how to use them for systematic stock research. Unlike trading platforms that assume you already know these metrics, this guide explains each field's purpose, interpretation, and typical values.

### Why These Fields Matter

Successful long-term investing requires understanding what separates great businesses from mediocre ones. These 75+ fields give you the same fundamental and technical data that professional analysts use - organized for learning and practical application.

**You'll learn:**
- **Valuation** - Is the stock price reasonable? (P/E, EV/EBITDA, PEG)
- **Profitability** - How efficiently does the business generate returns? (ROE, ROA, ROIC, margins)
- **Financial health** - Can the company weather storms? (debt ratios, current ratio, free cash flow)
- **Growth** - Is the business expanding? (revenue growth, EPS growth)
- **Technical confirmation** - Does price action support fundamentals? (RSI, moving averages, volatility)

Each field includes typical value ranges (excellent/good/average/poor) to help you interpret results and build screening criteria. Start with a few key metrics, then expand your analysis as you learn.

---

## Table of Contents

- [Understanding Field Variants](#understanding-field-variants)
  - [Time Period Suffixes](#time-period-suffixes)
  - [Common Patterns](#common-patterns)
- [Fundamental Fields](#fundamental-fields)
  - [Core Metrics](#core-metrics)
  - [Valuation & Enterprise Value](#valuation--enterprise-value)
  - [Margins & Profitability](#margins--profitability)
  - [Returns & Efficiency](#returns--efficiency)
  - [Balance Sheet](#balance-sheet)
  - [Dividends](#dividends)
- [Technical Fields](#technical-fields)
- [Performance Fields](#performance-fields)
- [Usage Examples](#usage-examples)

---

## Understanding Field Variants

Many financial metrics have multiple time period variants. Understanding these is crucial for accurate screening and matching TradingView's web interface exactly.

### Time Period Suffixes

| Suffix | Full Name | Description | Update Frequency | Volatility |
|--------|-----------|-------------|------------------|------------|
| **TTM** | Trailing Twelve Months | Rolling 12-month period | Quarterly | Medium |
| **FQ** | Fiscal Quarter | Most recent completed quarter | Quarterly | High |
| **FY** | Fiscal Year | Most recent completed fiscal year | Annually | Low |
| *(none)* | Current/Latest | Latest available data point | Varies | Varies |

### Common Patterns

**Return on Equity:**
- `return_on_equity` - Latest TTM data
- `return_on_equity_fq` - Most recent fiscal quarter

**Net Margin:**
- `net_margin_ttm` - Trailing twelve months
- `net_margin_fy` - Full fiscal year

**Debt/Equity:**
- `debt_to_equity` - Current ratio
- `debt_to_equity_fy` - Fiscal year ratio

### When to Use Which Variant

| Scenario | Recommended Variant | Reason |
|----------|-------------------|---------|
| Conservative screening | **FY** (Fiscal Year) | Most stable, less noise |
| Current analysis | **TTM** or **FQ** | Recent performance |
| Matching TradingView UI | **FQ/FY** variants | Exact match with web screener |
| Quarterly earnings plays | **FQ** | Most current quarter data |
| Annual fundamental analysis | **FY** | Full-year perspective |

### Example: Mixing Variants

```javascript
{
  filters: [
    { field: "return_on_equity_fq", operator: "greater", value: 15 },  // Current quarter performance
    { field: "debt_to_equity_fy", operator: "less", value: 0.6 },      // Annual stability
    { field: "net_margin_fy", operator: "greater", value: 12 },        // Full-year profitability
    { field: "price_earnings_ttm", operator: "less", value: 35 }       // Rolling valuation
  ]
}
```

---

## Fundamental Fields

### Core Metrics

#### Return on Equity (ROE)

**Fields:**
- `return_on_equity` - ROE percentage (TTM)
- `return_on_equity_fq` - ROE percentage (Fiscal Quarter)

**Type:** Percent
**Description:** Net income as a percentage of shareholder equity. Measures how effectively management uses equity to generate profits.

**Typical Values:**
- Excellent: > 20%
- Good: 15-20%
- Average: 10-15%
- Poor: < 10%

**Example:**
```javascript
{ field: "return_on_equity_fq", operator: "greater", value: 15 }
```

---

#### Price-to-Earnings Ratio (P/E)

**Fields:**
- `price_earnings_ttm` - P/E ratio (Trailing Twelve Months)

**Type:** Number
**Description:** Stock price divided by earnings per share. Primary valuation metric.

**Typical Values:**
- Undervalued: < 15
- Fair: 15-25
- Growth: 25-40
- Expensive: > 40

**Example:**
```javascript
{ field: "price_earnings_ttm", operator: "less", value: 25 }
```

---

#### Price-to-Book Ratio (P/B)

**Fields:**
- `price_book_fq` - P/B ratio (Fiscal Quarter)

**Type:** Number
**Description:** Stock price divided by book value per share.

**Typical Values:**
- Deep value: < 1.0
- Reasonable: 1.0-3.0
- Premium: > 3.0

---

#### Debt-to-Equity Ratio

**Fields:**
- `debt_to_equity` - Current D/E ratio
- `debt_to_equity_fy` - Fiscal Year D/E ratio

**Type:** Number
**Description:** Total debt divided by total equity. Measures financial leverage.

**Typical Values:**
- Conservative: < 0.5
- Moderate: 0.5-1.0
- Aggressive: > 1.0

**Example:**
```javascript
{ field: "debt_to_equity_fy", operator: "less", value: 0.6 }
```

---

#### Market Capitalization

**Fields:**
- `market_cap_basic` - Market capitalization in dollars

**Type:** Currency
**Description:** Total market value (shares outstanding × price).

**Categories:**
- Mega cap: > $200B
- Large cap: $10B - $200B
- Mid cap: $2B - $10B
- Small cap: $300M - $2B
- Micro cap: < $300M

---

### Valuation & Enterprise Value

#### Enterprise Value (EV)

**Fields:**
- `enterprise_value_current` - Current enterprise value

**Type:** Currency
**Description:** Market cap + total debt - cash. Represents true acquisition cost.

**Formula:** `EV = Market Cap + Debt - Cash`

**Example:**
```javascript
{ field: "enterprise_value_current", operator: "greater", value: 1000000000 }
```

---

#### EV/EBIT Ratio

**Fields:**
- `enterprise_value_to_ebit_ttm` - EV/EBIT (Trailing Twelve Months)

**Type:** Number
**Description:** Enterprise value divided by earnings before interest and taxes.

**Typical Values:**
- Undervalued: < 10
- Fair: 10-20
- Expensive: > 20

**Example:**
```javascript
{ field: "enterprise_value_to_ebit_ttm", operator: "less", value: 15 }
```

---

#### EV/EBITDA Ratio

**Fields:**
- `enterprise_value_ebitda_ttm` - EV/EBITDA (TTM)

**Type:** Number
**Description:** Enterprise value divided by EBITDA. Popular for M&A valuations.

**Typical Values:**
- Cheap: < 8
- Fair: 8-12
- Expensive: > 12

---

#### PEG Ratio

**Fields:**
- `price_earnings_growth_ttm` - PEG ratio (TTM)

**Type:** Number
**Description:** P/E ratio divided by earnings growth rate. Factors growth into valuation.

**Typical Values:**
- Undervalued: < 1.0
- Fair: 1.0-1.5
- Overvalued: > 1.5

**Example:**
```javascript
{ field: "price_earnings_growth_ttm", operator: "less", value: 1.0 }
```

---

#### EBITDA

**Fields:**
- `ebitda` - Earnings before interest, taxes, depreciation, and amortization

**Type:** Currency
**Description:** Operating profitability metric that excludes non-operating factors.

---

### Margins & Profitability

#### Net Margin

**Fields:**
- `net_margin_ttm` - Net margin percentage (TTM)
- `net_margin_fy` - Net margin percentage (Fiscal Year)

**Type:** Percent
**Description:** Net income as percentage of revenue.

**Typical Values:**
- Excellent: > 20%
- Good: 10-20%
- Average: 5-10%
- Poor: < 5%

**Example:**
```javascript
{ field: "net_margin_fy", operator: "greater", value: 12 }
```

---

#### Gross Margin

**Fields:**
- `gross_margin` - Gross margin percentage
- `gross_margin_ttm` - Gross margin percentage (TTM)

**Type:** Percent
**Description:** Gross profit as percentage of revenue. Measures pricing power.

**Typical Values:**
- Software/SaaS: 70-90%
- Manufacturing: 20-40%
- Retail: 10-30%

**Example:**
```javascript
{ field: "gross_margin_ttm", operator: "greater", value: 40 }
```

---

#### Operating Margin

**Fields:**
- `operating_margin` - Operating margin percentage
- `operating_margin_ttm` - Operating margin percentage (TTM)

**Type:** Percent
**Description:** Operating income as percentage of revenue.

**Typical Values:**
- Excellent: > 25%
- Good: 15-25%
- Average: 10-15%
- Poor: < 10%

**Example:**
```javascript
{ field: "operating_margin_ttm", operator: "greater", value: 15 }
```

---

#### Pre-Tax Margin

**Fields:**
- `pre_tax_margin_ttm` - Pre-tax margin percentage (TTM)

**Type:** Percent
**Description:** Pre-tax income as percentage of revenue.

**Example:**
```javascript
{ field: "pre_tax_margin_ttm", operator: "greater", value: 18 }
```

---

#### After-Tax Margin

**Fields:**
- `after_tax_margin` - After-tax margin percentage

**Type:** Percent
**Description:** Net income after taxes as percentage of revenue. Similar to net margin, measures bottom-line profitability after all expenses including taxes.

**Typical Values:**
- Excellent: > 20%
- Good: 10-20%
- Average: 5-10%
- Poor: < 5%

**Example:**
```javascript
{ field: "after_tax_margin", operator: "greater", value: 10 }
```

---

#### Free Cash Flow Margin

**Fields:**
- `free_cash_flow_margin_ttm` - FCF margin percentage (TTM)

**Type:** Percent
**Description:** Free cash flow as percentage of revenue. Measures cash generation efficiency.

**Typical Values:**
- Excellent: > 20%
- Good: 10-20%
- Average: 5-10%

---

### Returns & Efficiency

#### Return on Assets (ROA)

**Fields:**
- `return_on_assets` - ROA percentage
- `return_on_assets_fq` - ROA percentage (Fiscal Quarter)

**Type:** Percent
**Description:** Net income relative to total assets. Measures asset efficiency.

**Typical Values:**
- Excellent: > 10%
- Good: 5-10%
- Average: < 5%

**Example:**
```javascript
{ field: "return_on_assets_fq", operator: "greater", value: 8 }
```

---

#### Return on Invested Capital (ROIC)

**Fields:**
- `return_on_invested_capital_fq` - ROIC percentage (Fiscal Quarter)

**Type:** Percent
**Description:** Return on total invested capital (equity + debt). Warren Buffett's favorite metric.

**Typical Values:**
- Excellent (moat): > 20%
- Good: 12-20%
- Average: < 12%

**Example:**
```javascript
{ field: "return_on_invested_capital_fq", operator: "greater", value: 15 }
```

---

#### R&D Ratio

**Fields:**
- `research_and_dev_ratio_ttm` - R&D expenses as % of revenue (TTM)

**Type:** Percent
**Description:** Research and development spending relative to revenue.

**Typical Values:**
- Tech/Pharma: 15-25%
- Industrial: 3-8%
- Retail: < 2%

---

#### SG&A Ratio

**Fields:**
- `sell_gen_admin_exp_other_ratio_ttm` - SG&A expenses as % of revenue (TTM)

**Type:** Percent
**Description:** Selling, general, and administrative expenses as percentage of revenue.

---

### Balance Sheet

#### Total Assets

**Fields:**
- `total_assets` - Total company assets

**Type:** Currency
**Description:** Sum of all company assets (current + non-current).

**Example:**
```javascript
{ field: "total_assets", operator: "greater", value: 10000000000 }
```

---

#### Total Debt

**Fields:**
- `total_debt` - Total company debt

**Type:** Currency
**Description:** Sum of short-term and long-term debt.

---

#### Current Ratio

**Fields:**
- `current_ratio` - Current assets / current liabilities

**Type:** Number
**Description:** Liquidity measure - ability to pay short-term obligations.

**Typical Values:**
- Strong: > 2.0
- Healthy: 1.5-2.0
- Adequate: 1.0-1.5
- Concerning: < 1.0

**Example:**
```javascript
{ field: "current_ratio", operator: "greater", value: 1.5 }
```

---

### Dividends

#### Dividend Yield

**Fields:**
- `dividend_yield_recent` - Recent dividend yield percentage
- `dividends_yield_current` - Current dividend yield percentage

**Type:** Percent
**Description:** Annual dividend divided by stock price.

**Example:**
```javascript
{ field: "dividend_yield_recent", operator: "greater", value: 3 }
```

---

#### Dividend Payout Ratio

**Fields:**
- `dividend_payout_ratio_ttm` - Payout ratio percentage (TTM)

**Type:** Percent
**Description:** Dividends paid as percentage of earnings.

**Typical Values:**
- Sustainable: < 60%
- Aggressive: 60-80%
- Risky: > 80%

---

## Technical Fields

### Relative Strength Index (RSI)

**Fields:**
- `RSI` - RSI(14) value

**Type:** Number
**Range:** 0-100
**Description:** Momentum oscillator measuring overbought/oversold conditions.

**Interpretation:**
- Oversold: < 30
- Neutral: 30-70
- Overbought: > 70

**Example:**
```javascript
{ field: "RSI", operator: "in_range", value: [45, 65] }
```

---

### Moving Averages

**Fields:**
- `SMA50` - 50-day simple moving average
- `SMA200` - 200-day simple moving average

**Type:** Number
**Description:** Average price over N days.

**Golden Cross:**
```javascript
{ field: "SMA50", operator: "greater", value: "SMA200" }
```

**Price Above Trend:**
```javascript
{ field: "close", operator: "greater", value: "SMA50" }
```

---

### Volatility

**Fields:**
- `Volatility.M` - Monthly volatility percentage

**Type:** Percent
**Description:** Price volatility over the past month.

**Typical Values:**
- Low: < 2%
- Medium: 2-4%
- High: > 4%

**Example:**
```javascript
{ field: "Volatility.M", operator: "less", value: 3 }
```

---

### Beta

**Fields:**
- `beta_1_year` - 1-year beta
- `beta_5_year` - 5-year beta

**Type:** Number
**Description:** Volatility relative to market (S&P 500).

**Interpretation:**
- Defensive: < 1.0
- Market: = 1.0
- Aggressive: > 1.0

---

## Performance Fields

### Price

**Fields:**
- `close` - Current/closing price

**Type:** Currency
**Description:** Most recent closing price or current price during market hours.

**Example:**
```javascript
{ field: "close", operator: "greater_or_equal", value: 10 }
```

---

### Change

**Fields:**
- `change` - Daily percentage change

**Type:** Percent
**Description:** Percentage change from previous close.

---

### Volume

**Fields:**
- `volume` - Current day volume
- `average_volume_90d_calc` - 90-day average volume

**Type:** Number
**Description:** Number of shares traded.

**Example:**
```javascript
{ field: "average_volume_90d_calc", operator: "greater", value: 200000 }
```

---

### Performance Metrics

**Fields:**
- `Perf.W` - Weekly performance (%)
- `Perf.1M` - 1-month performance (%)
- `Perf.Y` - Yearly performance (%)

**Type:** Percent
**Description:** Price performance over specified period.

**Example:**
```javascript
{ field: "Perf.1M", operator: "greater", value: 5 }
```

---

### Revenue & Growth

**Fields:**
- `revenue_per_share_ttm` - Revenue per share (TTM)
- `total_revenue_yoy_growth_ttm` - YoY revenue growth percentage (TTM)

**Type:** Currency / Percent
**Description:** Top-line growth metrics.

**Example:**
```javascript
{ field: "total_revenue_yoy_growth_ttm", operator: "greater", value: 10 }
```

---

### Exchange & Listing

**Fields:**
- `exchange` - Stock exchange (NASDAQ, NYSE, CBOE, OTC, etc.)
- `is_primary` - Primary listing indicator (boolean)

**Type:** String / Boolean
**Description:** Where the stock is traded and whether it's the primary listing.

**Example (US major exchanges only):**
```javascript
{ field: "exchange", operator: "in_range", value: ["NASDAQ", "NYSE", "CBOE"] }
```

**Example (primary listings only):**
```javascript
{ field: "is_primary", operator: "equal", value: true }
```

---

### Sector & Industry

**Fields:**
- `sector` - Business sector
- `industry` - Specific industry
- `fundamental_currency_code` - Reporting currency (USD, EUR, etc.)

**Type:** String
**Description:** Company classification and currency.

---

## Usage Examples

### Example 1: Quality Value Screen

```javascript
{
  filters: [
    { field: "return_on_equity_fq", operator: "greater", value: 15 },
    { field: "price_earnings_ttm", operator: "less", value: 20 },
    { field: "debt_to_equity_fy", operator: "less", value: 0.5 },
    { field: "gross_margin_ttm", operator: "greater", value: 40 }
  ]
}
```

### Example 2: High-ROIC Compounders

```javascript
{
  filters: [
    { field: "return_on_invested_capital_fq", operator: "greater", value: 20 },
    { field: "free_cash_flow_margin_ttm", operator: "greater", value: 15 },
    { field: "current_ratio", operator: "greater", value: 1.5 },
    { field: "total_revenue_yoy_growth_ttm", operator: "greater", value: 10 }
  ]
}
```

### Example 3: Enterprise Value Screening

```javascript
{
  filters: [
    { field: "enterprise_value_to_ebit_ttm", operator: "less", value: 12 },
    { field: "enterprise_value_ebitda_ttm", operator: "less", value: 10 },
    { field: "price_earnings_growth_ttm", operator: "less", value: 1.0 }
  ]
}
```

### Example 4: Technical + Fundamental

```javascript
{
  filters: [
    // Fundamentals
    { field: "return_on_equity", operator: "greater", value: 15 },
    { field: "debt_to_equity", operator: "less", value: 0.6 },

    // Technicals
    { field: "RSI", operator: "in_range", value: [45, 65] },
    { field: "SMA50", operator: "greater", value: "SMA200" },
    { field: "Volatility.M", operator: "less", value: 3 }
  ]
}
```

---

## See Also

- [Preset Strategies](presets.md) - Pre-configured screening strategies
- [Development Guide](development.md) - How to add new fields
- [Main README](../README.md) - Getting started guide

---

**Smarter screens, not faster trades.**
