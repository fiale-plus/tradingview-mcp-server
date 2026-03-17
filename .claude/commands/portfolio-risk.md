---
description: Portfolio concentration and risk analysis for a set of holdings — sector breakdown, beta, volatility, and risk profile
---

# Portfolio Risk Analysis

Analyze concentration risk, market sensitivity, and volatility profile for a portfolio of stocks.

## Steps:

1. **Parse holdings from `$ARGUMENTS`**
   - Accept comma-separated or space-separated symbols: `AAPL, MSFT, GOOGL, JPM, XOM`
   - Accept 2 to 20 symbols
   - If no exchange prefix is provided, try NASDAQ: then NYSE:
   - If fewer than 2 symbols are provided, prompt the user for at least 2

2. **Fetch data using `mcp__tradingview__lookup_symbols`**
   - symbols: [all normalized symbols]
   - columns:
     - name, close, market_cap_basic, sector, industry
     - beta_1_year, ATR, Volatility.M
     - Perf.Y, Perf.YTD
     - debt_to_equity, dividends_yield_current

3. **Portfolio Overview Table**
   Display all holdings with key metrics:
   ```
   | Symbol  | Name                 | Price    | Mkt Cap | Sector               | Beta | Div Yield% | 1Y%   |
   |---------|----------------------|----------|---------|----------------------|------|------------|-------|
   | AAPL    | Apple Inc            | $185.92  | 2.87T   | Technology           | 1.24 | 0.55%      | +24.2 |
   | MSFT    | Microsoft Corp       | $415.30  | 3.08T   | Technology           | 0.90 | 0.73%      | +31.5 |
   ```
   - Truncate names to 20 characters
   - Format market caps with B/T suffix

4. **Concentration Analysis**

   **Sector Breakdown:**
   - Count holdings per sector
   - Calculate % of portfolio by count (treat equal-weight if no position sizes given)
   - Display as a table:
     ```
     | Sector         | Holdings | % of Portfolio | Risk Flag |
     |----------------|----------|----------------|-----------|
     | Technology     | 3        | 60%            | ⚠️ HIGH   |
     | Financials     | 1        | 20%            | OK        |
     | Energy         | 1        | 20%            | OK        |
     ```
   - Flag any sector with >40% of holdings as "⚠️ HIGH concentration risk"
   - Flag any sector with >60% as "❌ CRITICAL concentration risk"

   **Industry Breakdown:**
   - List any industry where 2+ holdings overlap
   - Warn: "X holdings in [Industry] — high correlation risk"

5. **Risk Metrics**

   - **Average Portfolio Beta**: mean of all betas (weighted equally)
     - <0.8 = "Defensive (low market sensitivity)"
     - 0.8-1.2 = "Market-like sensitivity"
     - >1.2 = "Aggressive (amplified market moves)"
   - **High-Beta Holdings** (beta > 1.5): list symbols
   - **Low-Beta Holdings** (beta < 0.8): list symbols
   - **Average Monthly Volatility**: mean of Volatility.M values
   - **Dividend Income**: list any holdings with yield > 1%, note average yield

6. **Correlation Note**
   - If 2+ holdings are in the same sector: "Multiple holdings in [Sector] — expect higher correlation"
   - If 2+ holdings are in the same industry: "⚠️ [Stock1] and [Stock2] are both in [Industry] — near-perfect correlation likely"
   - If all holdings are in different sectors: "Good sector diversification across [N] sectors"

7. **Risk Profile Summary**

   Determine overall portfolio risk profile:
   - **Conservative**: avg beta < 0.8 AND no sector >40% AND avg monthly vol < 4%
   - **Moderate**: avg beta 0.8-1.2 AND no sector >60%
   - **Aggressive**: avg beta > 1.2 OR any sector >60% OR avg monthly vol > 6%

   Display:
   ```
   Overall Risk Profile: [Conservative / Moderate / Aggressive]
   ```

   List **Top 3 Risk Factors** (e.g.):
   1. High sector concentration in Technology (60%)
   2. Elevated average beta of 1.35 — portfolio amplifies market moves
   3. No defensive/income holdings to buffer downturns

   List **Top 3 Diversification Opportunities** (if applicable):
   1. Consider adding exposure to [underrepresented sector]
   2. A low-beta holding (beta <0.8) could reduce overall portfolio volatility
   3. Income holdings could provide downside cushion

## Important Notes:
- Assume equal-weight portfolio if no position sizes are provided; note this assumption
- If beta data is unavailable for a holding, skip it in beta calculations and note the omission
- Format all percentages with 1 decimal place
- This is analytical output, not financial advice
