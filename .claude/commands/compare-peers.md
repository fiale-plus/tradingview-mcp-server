---
description: Side-by-side fundamental and technical comparison of 2-5 stocks with rankings and summary
---

# Compare Peers

Compare 2-5 stocks side-by-side across valuation, quality, growth, and technical metrics. Ranks each stock per metric and summarizes which is best for different investment styles.

## Steps:

1. **Parse symbols from `$ARGUMENTS`**
   - Accept comma-separated or space-separated symbols: `AAPL MSFT GOOGL` or `AAPL, MSFT, GOOGL`
   - Accept 2 to 5 symbols maximum
   - If no exchange prefix is provided, try NASDAQ: then NYSE:
   - If fewer than 2 symbols are provided, ask the user for at least 2 symbols

2. **Fetch data using `mcp__tradingview__lookup_symbols`**
   - symbols: [all normalized symbols]
   - columns:
     - name, close, market_cap_basic
     - return_on_equity, price_earnings_ttm, price_book_fq, price_sales_current
     - gross_margin_ttm, net_margin_ttm, free_cash_flow_margin_ttm
     - total_revenue_yoy_growth_ttm, earnings_per_share_diluted_yoy_growth_ttm
     - debt_to_equity, beta_1_year, dividends_yield_current
     - Perf.Y, Perf.YTD, RSI
     - sector, industry

3. **Display comparison table**
   - Markdown table with metrics as rows and stock symbols as columns
   - Format:
     ```
     | Metric              | AAPL      | MSFT      | GOOGL     |
     |---------------------|-----------|-----------|-----------|
     | Price               | $185.92   | $415.30   | $175.44   |
     | Market Cap          | 2.87T     | 3.08T     | 2.19T     |
     | P/E (TTM)           | 29.8      | 35.2      | 23.1      |
     | P/B                 | 45.2      | 13.4      | 6.8       |
     | P/S                 | 7.8       | 13.1      | 5.9       |
     | ROE %               | 147.3     | 38.2      | 26.1      |
     | Gross Margin %      | 45.6      | 69.4      | 55.3      |
     | Net Margin %        | 26.4      | 35.7      | 23.5      |
     | FCF Margin %        | 27.1      | 33.2      | 21.8      |
     | Revenue Growth %    | +5.2      | +16.0     | +14.3     |
     | EPS Growth %        | +8.1      | +18.3     | +31.2     |
     | Debt/Equity         | 1.96      | 0.41      | 0.06      |
     | Beta                | 1.24      | 0.90      | 1.05      |
     | Div Yield %         | 0.55      | 0.73      | N/A       |
     | 1Y Return %         | +24.2     | +31.5     | +35.7     |
     | YTD Return %        | +8.4      | +6.2      | +12.1     |
     | RSI                 | 62        | 58        | 66        |
     ```
   - Bold the best value in each row (lowest P/E, highest ROE, etc.)
   - Show "N/A" for any missing data

4. **Rankings section**
   For each key metric, rank the symbols from best to worst (1st = best):
   - Value rank: lowest P/E, P/B, P/S
   - Quality rank: highest ROE, gross margin, net margin, FCF margin
   - Growth rank: highest revenue growth, EPS growth
   - Momentum rank: highest 1Y return, YTD return
   - Safety rank: lowest debt/equity, lowest beta
   Format as a compact table:
   ```
   | Category  | 1st    | 2nd    | 3rd    |
   |-----------|--------|--------|--------|
   | Value     | GOOGL  | AAPL   | MSFT   |
   | Quality   | MSFT   | AAPL   | GOOGL  |
   | Growth    | MSFT   | GOOGL  | AAPL   |
   | Momentum  | GOOGL  | MSFT   | AAPL   |
   | Safety    | GOOGL  | MSFT   | AAPL   |
   ```

5. **Summary**
   - **Best for Value**: [symbol] — brief reason
   - **Best for Growth**: [symbol] — brief reason
   - **Best for Quality**: [symbol] — brief reason
   - **Best for Income**: [symbol] — brief reason (or "none pay significant dividends")
   - **Standout differences**: note any metric where one stock significantly leads or lags all others (>2x difference)
   - **Sector/Industry note**: if stocks are from same sector, note correlation risk

## Important Notes:
- Format market caps: B for billions, T for trillions
- Format percentages with 1 decimal place and +/- sign for returns
- If a stock is not found, skip it and note the failure; require at least 2 successful results
- For "best" rankings, use context: lower is better for P/E, P/B, P/S, D/E, beta; higher is better for everything else
