---
description: Run a stock screener with preset strategies and save results to CSV
---

# Run Stock Screener

Interactive stock screening using pre-configured investment strategies. Results are displayed as a summary table and saved to CSV for further analysis.

## Steps:

1. **List available presets** using `mcp__tradingview__list_presets`
   - Get all available preset strategies

2. **Structured preset selection wizard** (ALWAYS show ALL screens):

   **CRITICAL: You MUST use AskUserQuestion with TWO separate questions in a SINGLE call to show both screens together.**

   Use AskUserQuestion with questions array containing BOTH questions:

   **Question 1** - "Select from common strategies:"
   - Header: "Strategy"
   - multiSelect: false
   - Options (4 choices):
     - label: "Quality Stocks", description: "High-quality, low-volatility stocks with strong fundamentals and uptrends (conservative)"
     - label: "Value Stocks", description: "Undervalued stocks with low P/E and P/B ratios"
     - label: "Dividend Stocks", description: "High dividend yield with consistent payout"
     - label: "Momentum Stocks", description: "Strong recent performance and technical momentum"

   **Question 2** - "Select from advanced strategies:"
   - Header: "Advanced"
   - multiSelect: false
   - Options (3 choices):
     - label: "Growth Stocks", description: "High-growth companies with strong revenue and earnings expansion"
     - label: "Quality Growth", description: "Comprehensive quality + growth screen with technical filters (advanced)"
     - label: "Market Indexes", description: "Global market indexes for market regime analysis (not a stock screen)"

   **Processing the user's selection**:
   - User will select EITHER from Question 1 OR Question 2 (one will be selected, the other will be "Other")
   - Determine which question has a non-"Other" answer, and use that as the selected preset
   - Map the selection to preset name:
     - "Quality Stocks" → quality_stocks
     - "Value Stocks" → value_stocks
     - "Dividend Stocks" → dividend_stocks
     - "Momentum Stocks" → momentum_stocks
     - "Growth Stocks" → growth_stocks
     - "Quality Growth" → quality_growth_screener
     - "Market Indexes" → market_indexes

3. **Fetch the preset configuration** using `mcp__tradingview__get_preset`
   - Use the mapped preset name
   - Get filters, markets, sort settings, and columns

4. **Run the screener**:
   - For filter-based presets: Use `mcp__tradingview__screen_stocks` with preset configuration
   - For symbol-based presets (market_indexes): Use `mcp__tradingview__lookup_symbols` with preset symbols
   - Request limit: 50 results (or less if preset specifies)

5. **Display compact summary table** (BEFORE saving to CSV):
   - Terminal constraints: ~80 columns wide, show first 20 rows
   - Format as compact table with aligned columns

   **For stock screeners**, show these columns (with max widths):
   - Symbol (10 chars) | Name (20 chars) | Price (8 chars) | Mkt Cap (10 chars) | ROE% (6 chars) | P/E (6 chars) | D/E (6 chars)
   - Example format:
     ```
     Symbol     | Name                 | Price    | Mkt Cap    | ROE%   | P/E    | D/E
     -----------|----------------------|----------|------------|--------|--------|-------
     AAPL       | Apple Inc            | $185.92  | 2.87T      | 147.3  | 29.8   | 1.96
     ```

   **For market indexes**, show these columns:
   - Symbol (12 chars) | Name (25 chars) | Price (10 chars) | Change% (8 chars) | Perf.Y% (8 chars)
   - Example format:
     ```
     Symbol       | Name                      | Price      | Change%  | Perf.Y%
     -------------|---------------------------|------------|----------|--------
     TVC:SPX      | S&P 500                   | 5,732.93   | +0.38    | +24.2
     ```

   - Include total count header: "Found X results (showing first 20)"
   - Truncate long text fields with "..."
   - Format large numbers: billions as "2.5B", trillions as "1.2T"
   - Format percentages with 1 decimal place

6. **Save results to CSV**:
   - First, ensure output directory exists: Run `mkdir -p docs/local/screening-runs` using Bash tool
   - Path: `docs/local/screening-runs/`
   - Filename format: `{preset_name}_{timestamp}.csv`
   - Timestamp format: `YYYY-MM-DD_HH-MM-SS`
   - Include ALL columns from the screener response
   - Use Write tool to create the CSV file

7. **Confirm to user**:
   - Show summary statistics (total results, top picks)
   - Display file path where CSV was saved
   - Suggest next steps (review results, compare with other strategies)

## CSV Format:
- First row: Column headers
- Subsequent rows: Data values
- Use comma separator
- Quote fields containing commas
- Include symbol column first for easy reference

## Important Notes:
- Handle both filter-based screening (stocks) and symbol-based lookup (indexes)
- For market_indexes preset, explain this is market regime analysis, not stock screening
- If screener returns 0 results, explain possible reasons (filters too strict, market conditions)
- Always create output directory before writing CSV (see step 6)
