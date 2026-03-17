---
description: Multi-asset macro market snapshot covering US and global indexes, VIX, DXY, yields, gold, oil, and crypto
---

# Macro Dashboard

Fetch a real-time snapshot of global market conditions across equities, currencies, bonds, commodities, and crypto. Synthesize signals into a brief market narrative.

## Steps:

1. **Fetch all macro assets in 3 batches using `mcp__tradingview__lookup_symbols`**

   **Batch 1 — US Equity Indexes:**
   - symbols: ["TVC:SPX", "TVC:DJI", "TVC:IXIC", "TVC:RUT"]
   - columns: ["name", "close", "change", "Perf.W", "Perf.1M", "Perf.Y", "RSI"]

   **Batch 2 — Global Equity Indexes:**
   - symbols: ["TVC:UKX", "TVC:DAX", "TVC:NI225", "TVC:HSI"]
   - columns: ["name", "close", "change", "Perf.W", "Perf.1M", "Perf.Y", "RSI"]

   **Batch 3 — Macro Signals:**
   - symbols: ["TVC:VIX", "TVC:DXY", "TVC:US10Y", "TVC:GOLD", "NYMEX:CL1!", "CRYPTOCAP:BTC"]
   - columns: ["name", "close", "change", "Perf.W", "Perf.1M", "Perf.Y", "RSI"]

2. **Display results in three sections**

   **US Equity**
   ```
   | Index     | Price     | Change%  | Perf.W%  | Perf.1M% | Perf.Y%  | RSI |
   |-----------|-----------|----------|----------|----------|----------|-----|
   | S&P 500   | 5,732.93  | +0.38%   | +1.2%    | +3.2%    | +24.2%   | 62  |
   | Dow Jones | 42,150.41 | +0.22%   | +0.8%    | +2.8%    | +18.3%   | 60  |
   | Nasdaq    | 18,650.14 | +0.51%   | +1.7%    | +4.1%    | +31.5%   | 64  |
   | Russell   | 2,180.44  | -0.12%   | +0.3%    | +0.9%    | +8.7%    | 48  |
   ```

   **Global Equity**
   ```
   | Index     | Price     | Change%  | Perf.W%  | Perf.1M% | Perf.Y%  | RSI |
   |-----------|-----------|----------|----------|----------|----------|-----|
   | FTSE 100  | 8,250.10  | +0.15%   | +0.5%    | +1.3%    | +6.4%    | 54  |
   | DAX       | 17,980.45 | +0.28%   | +0.9%    | +2.1%    | +14.2%   | 58  |
   | Nikkei    | 38,420.30 | -0.33%   | -0.8%    | +1.4%    | +18.6%   | 55  |
   | Hang Seng | 16,850.22 | +1.12%   | +2.4%    | +6.3%    | -8.2%    | 52  |
   ```

   **Macro Signals**
   ```
   | Asset     | Level     | Change%  | Perf.W%  | Perf.1M% | Perf.Y%  | RSI | Interpretation          |
   |-----------|-----------|----------|----------|----------|----------|-----|-------------------------|
   | VIX       | 17.4      | -0.8%    | -5.2%    | -12.1%   | -28.4%   | 38  | Calm (<20)              |
   | DXY       | 103.2     | +0.3%    | +0.8%    | +1.2%    | +2.4%    | 56  | Neutral / Strengthening |
   | 10Y Yield | 4.42%     | +0.02%   | +0.1%    | +0.3%    | +0.8%    | 55  | Elevated                |
   | Gold      | 2,050     | +0.5%    | +1.3%    | +3.2%    | +12.1%   | 61  | Safe Haven Bid          |
   | WTI Oil   | 79.4      | -0.4%    | -1.2%    | +2.1%    | +5.3%    | 49  | Neutral                 |
   | BTC       | 68,400    | +2.1%    | +8.4%    | +18.3%   | +142%    | 66  | Risk-On                 |
   ```

3. **Macro Signal Interpretations** (apply these rules automatically):

   **VIX (Fear Gauge)**:
   - >30 = "High Fear — market stress elevated"
   - 20-30 = "Elevated — caution warranted"
   - <20 = "Calm — low fear environment"

   **DXY (US Dollar Index)**:
   - 1M change > +1% = "Strengthening Dollar — headwind for commodities & EM"
   - 1M change < -1% = "Weakening Dollar — tailwind for commodities & EM"
   - Otherwise = "Neutral / Stable"

   **TNX (10Y Treasury Yield)**:
   - Level > 5% = "Elevated yield — risk-free competition for equities"
   - Level 4-5% = "High — watch for rate sensitivity"
   - Level < 4% = "Moderate — supportive for equities"
   - 1M change > +0.2% = add "rising"
   - 1M change < -0.2% = add "falling"

   **Gold**:
   - 1M > +3% = "Strong safe-haven demand"
   - 1M > 0% = "Modest safe-haven bid"
   - 1M < 0% = "Risk appetite reducing safe-haven demand"

   **BTC**:
   - 1M > +10% = "Risk-On — crypto rallying"
   - 1M between -10% and +10% = "Neutral"
   - 1M < -10% = "Risk-Off — crypto selling"

4. **Market Narrative**
   Write 3-5 sentences synthesizing all signals into a coherent macro picture. Address:
   - Overall equity market tone (US and global)
   - Risk appetite (VIX + BTC signals)
   - Dollar and yield environment
   - Any notable divergences (e.g., gold rising while equities strong = hedging)

5. **Close with:**
   "Run /market-regime for detailed ATH analysis across global indexes."

## Important Notes:
- Format index prices with comma separators for readability
- Format all percentages with 1 decimal place and +/- sign
- Make 3 separate `lookup_symbols` calls (one per batch) to stay within API limits
- If any symbol fails to resolve, skip it and note the omission
