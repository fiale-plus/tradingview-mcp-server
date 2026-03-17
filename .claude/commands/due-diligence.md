---
description: Structured due diligence report for a single stock symbol with valuation, quality, growth, technical, and performance analysis
---

# Due Diligence Report

Generate a comprehensive due diligence report for a single stock symbol, covering fundamentals, technicals, and a checklist assessment.

## Steps:

1. **Parse the symbol from `$ARGUMENTS`**
   - Accept formats like `AAPL`, `NASDAQ:AAPL`, `NYSE:JPM`
   - If no exchange prefix provided, try common exchanges: NASDAQ:, NYSE:
   - Use the first successfully resolved symbol

2. **Fetch data using `mcp__tradingview__lookup_symbols`**
   - symbols: [normalized symbol, e.g. "NASDAQ:AAPL"]
   - columns:
     - name, close, change, volume, market_cap_basic
     - return_on_equity, price_earnings_ttm, price_book_fq, price_sales_current
     - debt_to_equity, net_margin_ttm, gross_margin_ttm, operating_margin_ttm
     - free_cash_flow_ttm, free_cash_flow_margin_ttm
     - total_revenue_yoy_growth_ttm, earnings_per_share_diluted_yoy_growth_ttm
     - dividends_yield_current, dividend_payout_ratio_ttm
     - RSI, SMA50, SMA200, ATR, beta_1_year
     - Perf.W, Perf.1M, Perf.3M, Perf.Y, Perf.YTD
     - all_time_high, price_52_week_high, price_52_week_low
     - sector, industry, exchange

3. **Present results as a structured due diligence report with the following sections:**

   ### Overview
   - Company name, current price, market cap (formatted: B/T), sector, and industry
   - Exchange and today's price change %

   ### Valuation
   - P/E (TTM), P/B, P/S, FCF Yield (FCF TTM / Market Cap * 100)
   - Compare to rough benchmarks: P/E <15 cheap, 15-25 fair, >25 premium

   ### Quality
   - ROE, Gross Margin, Net Margin, Operating Margin, FCF Margin
   - Higher is generally better; flag if any margin is negative

   ### Growth
   - Revenue YoY Growth % (TTM)
   - EPS Diluted YoY Growth % (TTM)
   - Flag if growth is negative

   ### Balance Sheet
   - Debt/Equity ratio
   - <0.5 = conservative, 0.5-1 = moderate, >1 = elevated, >2 = high risk

   ### Dividends
   - Dividend Yield % (current)
   - Payout Ratio %
   - Note if no dividend is paid

   ### Technical
   - RSI (14): <30 oversold, 30-70 neutral, >70 overbought
   - Price vs SMA50: show % above/below
   - Price vs SMA200: show % above/below (golden/death cross context)
   - ATR (volatility measure), Beta (market sensitivity)

   ### Performance
   - Weekly, 1M, 3M, 1Y, YTD returns
   - % from ATH, % from 52w high, % from 52w low

4. **Checklist Assessment**
   For each section above, rate as:
   - ✅ Strong: metrics clearly above average / healthy benchmarks
   - ⚠️ Mixed: some positives and negatives, or data unavailable
   - ❌ Weak: metrics clearly below average or showing risk signals
   Include one-line reasoning for each rating.

5. **Overall Summary**
   - **Strengths**: top 2-3 positive factors
   - **Weaknesses**: top 2-3 risk factors or concerns
   - **What to Investigate Further**: 2-3 questions a thorough analyst would want to answer

## Important Notes:
- If symbol is not found with one exchange prefix, try another (e.g., NYSE: if NASDAQ: fails)
- Format large numbers: millions as "500M", billions as "2.5B", trillions as "1.2T"
- Format all percentages with 1 decimal place and +/- sign where appropriate
- If a field returns null/undefined, show "N/A" and note it in the assessment
- This is market data analysis, not financial advice
