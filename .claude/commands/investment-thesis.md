---
description: Generate a structured investment thesis template pre-filled with real market data for a stock
---

# Investment Thesis Generator

Generate a complete, data-driven investment thesis for a single stock — bull case, bear case, key metrics table, technical setup, and monitoring checklist.

## Steps:

1. **Parse symbol from `$ARGUMENTS`**
   - Accept formats like `AAPL`, `NASDAQ:AAPL`, `NYSE:JPM`
   - If no exchange prefix, try NASDAQ: then NYSE:
   - Use the first successfully resolved symbol

2. **Fetch data using `mcp__tradingview__lookup_symbols`**
   - symbols: [normalized symbol]
   - columns:
     - name, close, market_cap_basic, sector, industry, exchange
     - return_on_equity, price_earnings_ttm, price_book_fq, price_sales_current
     - enterprise_value_current, enterprise_value_ebitda_ttm
     - gross_margin_ttm, net_margin_ttm, free_cash_flow_ttm, free_cash_flow_margin_ttm
     - total_revenue_yoy_growth_ttm, earnings_per_share_diluted_yoy_growth_ttm
     - debt_to_equity, current_ratio, beta_1_year
     - dividends_yield_current, dividend_payout_ratio_ttm
     - RSI, SMA50, SMA200, Perf.Y, Perf.YTD, all_time_high, price_52_week_high

3. **Generate the investment thesis document** using the real data fetched above:

---

# Investment Thesis: [Company Name] ([SYMBOL])
*Data as of [today's date]. Not financial advice.*

## The Business
- **Sector**: [sector] | **Industry**: [industry]
- **Market Cap**: [formatted market cap] | **Exchange**: [exchange]
- [Write 2-3 sentences describing what this company does — use your knowledge of the company]

---

## Why This Stock

### Bull Case
Generate 3 bull case points based on the actual data. Use these signal rules:
1. If ROE > 15% AND (gross_margin > 30% OR net_margin > 15%): "Strong unit economics with [ROE]% ROE and [gross_margin]% gross margins, indicating durable competitive advantage"
2. If total_revenue_yoy_growth_ttm > 10%: "Revenue growing at [X]% YoY, significantly above GDP growth"
3. If price_earnings_ttm < 20 OR price_book_fq < 2 OR price_sales_current < 2: "Trading at an attractive valuation: P/E of [X], P/B of [X]"
4. If free_cash_flow_margin_ttm > 15%: "High FCF margin of [X]% provides financial flexibility for buybacks, dividends, or acquisitions"
5. If Perf.Y > 20% AND RSI < 70: "Strong 1Y momentum ([X]%) without being technically overbought (RSI [X])"
Fall back to the 3 strongest signals from the data if specific thresholds are not met.

### Bear Case
Generate 3 bear case points based on the actual data. Use these signal rules:
1. If debt_to_equity > 1: "Elevated leverage (D/E = [X]) increases financial risk in a rising rate environment"
2. If RSI > 70: "Technically overbought (RSI [X]) — mean reversion risk in the near term"
3. If close < SMA200: "Trading below the 200-day moving average — technical downtrend not yet resolved"
4. If price_earnings_ttm > 30: "Premium valuation (P/E [X]) leaves limited room for disappointment"
5. If total_revenue_yoy_growth_ttm < 5: "Slow revenue growth ([X]%) may limit future upside"
6. "What would invalidate this thesis: [describe 1 specific scenario, e.g., margin compression, market share loss, regulation]"
Fall back to the 3 weakest signals from the data if specific risk thresholds are not met.

---

## Key Metrics

| Metric         | Value         | Assessment                                           |
|----------------|---------------|------------------------------------------------------|
| P/E (TTM)      | [value or N/A]| [<15=Cheap, 15-25=Fair, >25=Premium, N/A=N/A]       |
| EV/EBITDA      | [value or N/A]| [<10=Value, 10-20=Fair, >20=Expensive, N/A=N/A]     |
| P/B            | [value or N/A]| [<1=Deep Value, 1-3=Fair, >3=Premium]                |
| P/S            | [value or N/A]| [<2=Value, 2-5=Fair, >5=Growth Premium]              |
| ROE %          | [value or N/A]| [>20=Excellent, 10-20=Good, <10=Weak]                |
| Gross Margin % | [value or N/A]| [>50=Excellent, 30-50=Good, <30=Low]                 |
| Net Margin %   | [value or N/A]| [>20=Excellent, 10-20=Good, <10=Thin]                |
| FCF Margin %   | [value or N/A]| [>20=Excellent, 10-20=Good, <10=Thin]                |
| Revenue Growth | [value or N/A]| [>20%=High, 10-20%=Moderate, <10%=Low, <0=Shrinking]|
| EPS Growth     | [value or N/A]| [>20%=High, 10-20%=Moderate, <10%=Low, <0=Declining]|
| Debt/Equity    | [value or N/A]| [<0.5=Low, 0.5-1=Moderate, >1=High, >2=Risky]       |
| Current Ratio  | [value or N/A]| [>2=Strong, 1-2=Adequate, <1=Caution]                |
| Div Yield %    | [value or N/A]| [>3=Income, 1-3=Modest, <1=Minimal, 0=None]          |

---

## Technical Setup

- **Price**: [close] | **RSI (14)**: [RSI] — [Overbought >70 / Neutral 30-70 / Oversold <30]
- **vs SMA50**: [X.X% above/below] — [bullish/bearish short-term]
- **vs SMA200**: [X.X% above/below] — [above=uptrend / below=downtrend]
- **vs 52-Week High**: [X.X% below]
- **vs ATH**: [X.X% below]
- **YTD Return**: [Perf.YTD]% | **1Y Return**: [Perf.Y]%

---

## Entry / Exit Framework

- **Entry Zone**: [Based on data: if price is near SMA50, suggest "near current levels around SMA50 ($[SMA50])"; if below SMA200, suggest "wait for reclaim of SMA200 ($[SMA200])"]
- **Stop Loss**: [Suggest approximately 1-2x ATR below entry; note ATR if available]
- **Target**: [Based on valuation: if undervalued, suggest 20-30% upside; if fairly valued, 10-20%; note this is illustrative]
- **Time Horizon**: [Based on data: if momentum stock (high growth, high RSI), suggest 6-12 months; if value stock (low P/E), suggest 12-24 months]

---

## What to Monitor

List 3-4 key metrics or events specific to this stock:
- [If high D/E]: Watch quarterly debt reduction and interest coverage ratio
- [If high growth]: Monitor quarterly revenue growth consistency — any deceleration is a warning
- [If high P/E]: Earnings beats/misses will have outsized price impact given premium valuation
- [Use your knowledge of the company]: Note any specific catalysts (product launches, regulatory events, macro sensitivities)

---

4. **After generating the thesis**, add a one-paragraph analyst note summarizing the overall investment quality score:
   - Count how many of the Key Metrics are in the "excellent/good/cheap" tier
   - Rate as: "High Quality" (8+), "Decent" (5-7), "Mixed/Speculative" (below 5)
   - Note the single strongest and single weakest factor

## Important Notes:
- Use real data from the API; do not invent numbers
- Show "N/A" for any field that returns null or undefined
- Format market caps with B/T suffix (e.g., "2.87T", "450B")
- Format all percentages with 1 decimal place
- Use your knowledge of the company for the business description and thesis context — the API provides numbers, you provide context
