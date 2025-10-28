---
description: Run a stock screener with preset strategies and save results to CSV
---

# Run Stock Screener

Interactive stock screening using pre-configured investment strategies. Results are displayed as a summary table and saved to CSV for further analysis.

## Steps:

1. **List available presets** using `mcp__tradingview__list_presets`
   - Show user the available preset strategies

2. **Ask user to select a preset** using AskUserQuestion tool:
   - Question: "Which screening strategy would you like to use?"
   - Header: "Strategy"
   - Options: Present each preset as an option with its description
   - For symbol-based presets (market_indexes), use lookup_symbols instead of screen_stocks

3. **Fetch the preset configuration** using `mcp__tradingview__get_preset`
   - Get filters, markets, sort settings, and columns

4. **Run the screener**:
   - For filter-based presets: Use `mcp__tradingview__screen_stocks` with preset configuration
   - For symbol-based presets: Use `mcp__tradingview__lookup_symbols` with preset symbols
   - Request limit: 50 results (or less if preset specifies)

5. **Display summary table** with key columns:
   - For stocks: name, close, market_cap_basic, return_on_equity, price_earnings_ttm, debt_to_equity
   - For indexes: name, close, all_time_high, change, Perf.Y
   - Include total count of results

6. **Save results to CSV**:
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
- Ensure docs/local/screening-runs/ directory exists before writing
