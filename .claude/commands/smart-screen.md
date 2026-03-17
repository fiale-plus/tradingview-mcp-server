---
description: Auto-selects the best screening strategy based on current market regime, then runs and displays results
---

# Smart Screen

Automatically determines the current market regime by analyzing major US indexes, selects the most appropriate screening strategy, runs it, and displays the top results.

## Steps:

1. **Fetch market regime data using `mcp__tradingview__lookup_symbols`**
   - symbols: ["TVC:SPX", "TVC:IXIC", "TVC:RUT", "TVC:DJI"]
   - columns: ["name", "close", "all_time_high", "price_52_week_high", "price_52_week_low", "SMA200", "RSI", "Perf.1M"]

2. **Calculate regime indicators for SPX**
   - ATH Drawdown = ((close - all_time_high) / all_time_high) * 100
   - Is SPX above its SMA200? (close > SMA200)
   - SPX 1M performance

3. **Determine market regime** (based on SPX primarily):
   - **Bull Market**: SPX within 10% of ATH (drawdown > -10%) AND above SMA200
     - Recommended strategy: `quality_growth_screener` (if RSI < 65) or `momentum_stocks` (if RSI >= 65)
     - Rationale: Strong uptrend favors high-quality compounders and momentum
   - **Correction**: SPX 10-20% below ATH (drawdown between -20% and -10%) OR below SMA200
     - Recommended strategy: `quality_stocks` (if drawdown > -15%) or `value_stocks` (if drawdown <= -15%)
     - Rationale: Pullbacks favor defensive quality; deeper corrections favor value hunting
   - **Bear Market**: SPX more than 20% below ATH (drawdown < -20%)
     - Recommended strategy: `value_stocks` (if RSI > 35) or `dividend_stocks` (if RSI <= 35)
     - Rationale: Severe downturns favor deep value and income-producing assets

4. **Announce the regime and recommended strategy**
   Display prominently:
   ```
   Current Market Regime: [Bull Market / Correction / Bear Market]
   SPX: [price] | ATH Drawdown: [X.X%] | vs SMA200: [above/below]
   Recommended Strategy: [preset_name]
   ```
   Follow with 2-3 sentences explaining the rationale for this strategy given current conditions.
   Also show a compact table of all 4 indexes:
   ```
   | Index | Price    | ATH Drawdown | vs SMA200 | RSI | 1M%   |
   |-------|----------|--------------|-----------|-----|-------|
   | SPX   | 5,732    | -2.1%        | +8.3%     | 62  | +3.2% |
   | DJI   | 42,150   | -1.8%        | +6.1%     | 60  | +2.8% |
   | IXIC  | 18,650   | -3.4%        | +9.7%     | 64  | +4.1% |
   | RUT   | 2,180    | -8.2%        | -1.2%     | 48  | +0.9% |
   ```

5. **Fetch the recommended preset using `mcp__tradingview__get_preset`**
   - Use the determined preset name

6. **Run the screener**
   - If filter-based preset: use `mcp__tradingview__screen_stocks` with the preset's filters, markets, and sort config
   - limit: 10
   - Include columns: name, close, market_cap_basic, return_on_equity, price_earnings_ttm, net_margin_ttm, total_revenue_yoy_growth_ttm, Perf.Y, RSI

7. **Display top 10 results as a compact table**
   ```
   | Symbol     | Name                 | Price    | Mkt Cap | ROE%  | P/E   | Net Mg% | Rev Gr% | 1Y%   | RSI |
   |------------|----------------------|----------|---------|-------|-------|---------|---------|-------|-----|
   | AAPL       | Apple Inc            | $185.92  | 2.87T   | 147.3 | 29.8  | 26.4    | +5.2    | +24.2 | 62  |
   ```
   - Truncate names to 20 characters
   - Format market caps with B/T suffix
   - Format percentages with 1 decimal place

8. **Optionally save results to CSV**
   - Create directory: `mkdir -p docs/local/screening-runs` using Bash tool
   - Path: `docs/local/screening-runs/{preset_name}_{timestamp}.csv`
   - Timestamp format: YYYY-MM-DD_HH-MM-SS
   - Use Write tool to create the CSV with all result columns

## Important Notes:
- If ATH data seems stale (all_time_high < close), the index is making new ATHs — treat as Bull Market signal
- RUT (small caps) below SMA200 while SPX is above is a breadth warning — note this in the analysis
- If the screener returns 0 results, note it and suggest running `/run-screener` to try a different preset
