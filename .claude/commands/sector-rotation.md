---
description: Cross-sector performance ranking across all 11 GICS sectors to identify rotating momentum
---

# Sector Rotation Analysis

Identify which sectors are leading and lagging the market by screening the top large-cap stocks in each of the 11 GICS sectors and comparing their average performance.

## Steps:

1. **Screen top stocks for each of the 11 GICS sectors**
   For each sector listed below, call `mcp__tradingview__screen_stocks` with:
   - markets: ["america"]
   - sort_by: "market_cap_basic", sort_order: "desc"
   - limit: 5
   - columns: ["name", "close", "Perf.W", "Perf.1M", "Perf.3M", "Perf.Y", "RSI", "sector", "market_cap_basic"]

   The 11 sectors and their filter values:
   - Technology: `{field: "sector", operator: "equal", value: "Technology"}, {field: "market_cap_basic", operator: "greater", value: 1000000000}`
   - Healthcare: `{field: "sector", operator: "equal", value: "Health Technology"}, {field: "market_cap_basic", operator: "greater", value: 1000000000}`
   - Financials: `{field: "sector", operator: "equal", value: "Finance"}, {field: "market_cap_basic", operator: "greater", value: 1000000000}`
   - Consumer Cyclical: `{field: "sector", operator: "equal", value: "Consumer Cyclicals"}, {field: "market_cap_basic", operator: "greater", value: 1000000000}`
   - Consumer Defensive: `{field: "sector", operator: "equal", value: "Consumer Non-Cyclicals"}, {field: "market_cap_basic", operator: "greater", value: 1000000000}`
   - Energy: `{field: "sector", operator: "equal", value: "Energy Minerals"}, {field: "market_cap_basic", operator: "greater", value: 1000000000}`
   - Industrials: `{field: "sector", operator: "equal", value: "Producer Manufacturing"}, {field: "market_cap_basic", operator: "greater", value: 1000000000}`
   - Communication Services: `{field: "sector", operator: "equal", value: "Electronic Technology"}, {field: "market_cap_basic", operator: "greater", value: 1000000000}`
   - Real Estate: `{field: "sector", operator: "equal", value: "Finance"}, {field: "industry", operator: "equal", value: "Real Estate Investment Trusts"}, {field: "market_cap_basic", operator: "greater", value: 1000000000}`
   - Materials: `{field: "sector", operator: "equal", value: "Non-Energy Minerals"}, {field: "market_cap_basic", operator: "greater", value: 1000000000}`
   - Utilities: `{field: "sector", operator: "equal", value: "Utilities"}, {field: "market_cap_basic", operator: "greater", value: 1000000000}`

2. **Calculate average performance per sector**
   For each sector, compute averages of the top 5 stocks:
   - Average 1M return (Perf.1M)
   - Average 3M return (Perf.3M)
   - Average 1Y return (Perf.Y)
   - Average RSI
   If fewer than 5 stocks are returned, average the available results.

3. **Assign momentum signal**
   For each sector, compute the momentum signal based on 1M vs 3M/3:
   - **Accelerating**: Avg 1M > Avg 3M / 3 (recent month outpacing 3M trend)
   - **Decelerating**: Avg 1M < Avg 3M / 3 (recent month lagging 3M trend)
   - **Neutral**: Avg 1M approximately equal to Avg 3M / 3 (±0.5%)

4. **Display ranked sector table**
   Sort by Avg 1M performance (best to worst):
   ```
   | Rank | Sector               | Avg 1M%  | Avg 3M%  | Avg 1Y%  | Avg RSI | Signal       |
   |------|----------------------|----------|----------|----------|---------|--------------|
   | 1    | Technology           | +5.2%    | +12.1%   | +31.4%   | 64      | Accelerating |
   | 2    | Healthcare           | +3.8%    | +6.4%    | +18.2%   | 57      | Neutral      |
   | ...  | ...                  | ...      | ...      | ...      | ...     | ...          |
   | 11   | Real Estate          | -2.1%    | -1.8%    | -5.3%    | 42      | Decelerating |
   ```

5. **Identify rotation signals**
   - **Leading Sectors (top 3)**: list with their avg 1M and momentum signal
   - **Lagging Sectors (bottom 3)**: list with their avg 1M and momentum signal
   - **Rotation signal**: Note if any high-ranked sector has a Decelerating signal (possible peak) or a low-ranked sector has an Accelerating signal (possible bottom)

6. **Preset recommendations**
   Based on the leading sectors, suggest which preset to run:
   - Technology / Communication Services leading → suggest `momentum_stocks` or `growth_stocks`
   - Healthcare / Consumer Defensive leading → suggest `quality_stocks` or `dividend_stocks`
   - Financials / Energy / Materials leading → suggest `value_stocks`
   - Broad market strength → suggest `quality_growth_screener`
   Include a one-line rationale for each suggestion.

## Important Notes:
- Each sector requires a separate API call (11 calls total) — this may take a moment
- Format all performance figures with 1 decimal place and +/- sign
- If a sector returns 0 results, note it and skip it in rankings
- Round RSI to nearest integer
