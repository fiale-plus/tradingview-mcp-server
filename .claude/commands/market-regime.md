---
description: Check market regime by analyzing major global indexes relative to their all-time highs
---

# Market Regime Analysis

Fetch current levels for major global indexes and calculate drawdowns from all-time highs to assess overall market regime.

## Indexes to analyze:
- **Nasdaq Composite** (TVC:IXIC) - US tech-heavy market
- **OMX Stockholm 30** (OMXSTO:OMXS30) - Swedish large-cap
- **Nikkei 225** (TVC:NI225) - Japanese large-cap

## Steps:

1. Use `mcp__tradingview__lookup_symbols` to fetch:
   - symbols: ["TVC:IXIC", "OMXSTO:OMXS30", "TVC:NI225"]
   - columns: ["name", "close", "all_time_high", "price_52_week_high", "change", "Perf.Y", "RSI"]

2. For each index, calculate:
   - **Drawdown from ATH** = ((close - all_time_high) / all_time_high) * 100
   - Round to 2 decimal places

3. Assign regime status based on drawdown:
   - **🟢 GREEN (Normal)**: 0% to -5% from ATH
   - **🟡 AMBER (Caution)**: -5% to -10% from ATH
   - **🔴 RED (Warning)**: < -10% from ATH

4. Display results as a formatted markdown table with:
   - Index name
   - Current price
   - All-time high
   - Drawdown % from ATH
   - Status indicator (🟢/🟡/🔴)
   - 1Y Performance
   - RSI

5. Provide summary:
   - Count indexes by status (green/amber/red)
   - Overall market regime assessment
   - Note that ATH data may lag by 1-2 days

## Important:
- If all_time_high < close, the index is making NEW all-time highs (show as 🟢 with +X.XX% above ATH)
- Use price_52_week_high as reference if ATH seems stale
- Express drawdown as negative percentage when below ATH
