# Investor Commands Guide

## Overview

The TradingView MCP Server includes 9 built-in Claude Code commands for common investor workflows. Commands are invoked with a `/` prefix directly in Claude Code or Claude Desktop. They orchestrate the MCP server's tools automatically — you provide a symbol or no arguments at all, and the command handles the rest.

All commands use live TradingView market data. Results are analytical output, not financial advice.

---

## Quick Reference

| Command | Usage | Description |
|---------|-------|-------------|
| `/market-regime` | `/market-regime` | Check global index drawdowns from ATH to assess market health |
| `/run-screener` | `/run-screener` | Interactive preset-based stock screener with CSV export |
| `/due-diligence` | `/due-diligence AAPL` | Full fundamental + technical report for one stock |
| `/compare-peers` | `/compare-peers AAPL MSFT GOOGL` | Side-by-side comparison of 2–5 stocks with rankings |
| `/sector-rotation` | `/sector-rotation` | Rank all 11 GICS sectors by momentum to find leaders |
| `/smart-screen` | `/smart-screen` | Auto-detect market regime and run the best-fit screener |
| `/macro-dashboard` | `/macro-dashboard` | Multi-asset snapshot: equities, VIX, DXY, yields, gold, oil, BTC |
| `/portfolio-risk` | `/portfolio-risk AAPL MSFT AMZN GOOGL` | Concentration and risk analysis for a portfolio of holdings |
| `/investment-thesis` | `/investment-thesis NVDA` | Data-driven bull/bear thesis with entry/exit framework |

---

## Commands

### /market-regime

**What it does:** Fetches current prices and all-time highs for major global indexes (Nasdaq Composite, OMX Stockholm 30, Nikkei 225) and calculates each index's drawdown from its ATH. Assigns a traffic-light status and produces an overall market regime assessment.

**Output format:**

A markdown table showing each index with its current price, ATH, drawdown percentage, status indicator (Green/Amber/Red), 1-year performance, and RSI. Followed by a summary count (e.g., "2 green, 1 amber") and an overall regime call.

**Status thresholds:**
- Green (Normal): 0% to -5% from ATH
- Amber (Caution): -5% to -10% from ATH
- Red (Warning): below -10% from ATH

**When to use:** At the start of any analysis session to calibrate your risk posture before screening or reviewing individual stocks.

---

### /run-screener

**What it does:** Presents an interactive preset selection wizard, runs the chosen strategy, displays a compact results table, and saves results to a timestamped CSV file.

**Available strategies:**

| Preset | Key Criteria |
|--------|-------------|
| Quality Stocks | ROE >12%, D/E <0.7, P/E <40, low volatility, golden cross |
| Value Stocks | P/E <15, P/B <1.5, ROE >10%, large cap |
| Dividend Stocks | Yield >3%, large cap, D/E <1.0 |
| Momentum Stocks | RSI 50–70, golden cross, +5% 1M performance |
| Growth Stocks | ROE >20%, operating margin >15%, large cap |
| Quality Growth | Comprehensive: ROE >15%, revenue growth >8%, FCF positive, golden cross, RSI 45–62 |
| Market Indexes | Global index lookup (not a stock screen) |

**Output format:** Compact table showing Symbol, Name, Price, Market Cap, ROE%, P/E, and D/E for up to 20 results. CSV saved to `docs/local/screening-runs/{preset}_{timestamp}.csv`.

**When to use:** When you want to generate a candidate watchlist from a defined strategy. Use `/smart-screen` if you want the regime-appropriate preset chosen automatically.

---

### /due-diligence {symbol}

**What it does:** Fetches ~30 data fields for a single stock and produces a structured multi-section report with a checklist assessment and overall summary.

**Example:** `/due-diligence AAPL`

**Sections included:**

1. **Overview** — Company name, price, market cap, sector, industry, daily change
2. **Valuation** — P/E, P/B, P/S, FCF yield vs benchmarks (cheap / fair / premium)
3. **Quality** — ROE, gross margin, net margin, operating margin, FCF margin
4. **Growth** — Revenue YoY growth %, EPS diluted YoY growth %
5. **Balance Sheet** — Debt/Equity with risk classification (conservative / moderate / elevated / high risk)
6. **Dividends** — Yield %, payout ratio %
7. **Technical** — RSI, price vs SMA50 and SMA200, ATR, beta
8. **Performance** — Weekly, 1M, 3M, 1Y, YTD returns; % from ATH, 52w high, 52w low
9. **Checklist Assessment** — Each section rated Strong / Mixed / Weak with one-line reasoning
10. **Overall Summary** — Top strengths, top risks, questions to investigate further

**When to use this vs /compare-peers:** Use `/due-diligence` for a thorough examination of a single candidate. Use `/compare-peers` when you have 2–5 stocks and want to rank them against each other.

---

### /compare-peers {symbol1} {symbol2} ...

**What it does:** Fetches fundamental and technical data for 2–5 stocks simultaneously and presents a side-by-side comparison table with per-category rankings.

**Example:** `/compare-peers AAPL MSFT GOOGL`

**Metrics compared:**

Valuation (P/E, P/B, P/S), Quality (ROE, gross margin, net margin, FCF margin), Growth (revenue growth, EPS growth), Momentum (1Y return, YTD return), Safety (debt/equity, beta), plus dividend yield.

**Rankings produced:**

A compact table ranking each stock 1st through Nth for five categories: Value, Quality, Growth, Momentum, and Safety.

**Summary produced:**

- Best for Value, Best for Growth, Best for Quality, Best for Income
- Standout differences (any metric where one stock leads by >2x)
- Sector/industry correlation note

**Output format:** Metrics as rows, stocks as columns. Best value in each row is bolded.

---

### /sector-rotation

**What it does:** Screens the top 5 large-cap stocks in each of the 11 GICS sectors, calculates average 1M, 3M, and 1Y performance, assigns a momentum signal (Accelerating / Decelerating / Neutral), and ranks sectors from strongest to weakest.

**How sectors are ranked:** By average 1-month performance of the top 5 stocks in each sector.

**Momentum signal logic:**
- Accelerating: avg 1M > avg 3M / 3 (recent month outpacing the 3-month trend)
- Decelerating: avg 1M < avg 3M / 3 (recent month lagging the 3-month trend)
- Neutral: within ±0.5%

**TradingView sector name mapping (all 11 GICS sectors):**

| GICS Sector | TradingView Filter Value |
|-------------|--------------------------|
| Technology | `Technology` |
| Healthcare | `Health Technology` |
| Financials | `Finance` (excluding REITs) |
| Consumer Cyclical | `Consumer Cyclicals` |
| Consumer Defensive | `Consumer Non-Cyclicals` |
| Energy | `Energy Minerals` |
| Industrials | `Producer Manufacturing` |
| Communication Services | `Technology Services` |
| Real Estate | `Finance` + industry = REITs |
| Materials | `Non-Energy Minerals` |
| Utilities | `Utilities` |

**Output:** Ranked sector table with avg 1M%, 3M%, 1Y%, avg RSI, and signal. Followed by Leading Sectors (top 3), Lagging Sectors (bottom 3), rotation signal observations, and preset recommendations matched to the leading sectors.

Note: This command makes 11 separate API calls and may take 15–30 seconds.

---

### /smart-screen

**What it does:** Fetches S&P 500, Dow Jones, Nasdaq, and Russell 2000 data, detects the current market regime, auto-selects the best-fit preset, runs it, and displays the top 10 results.

**Regime detection logic (based on S&P 500):**

| Regime | Condition | Auto-Selected Strategy |
|--------|-----------|------------------------|
| Bull Market | SPX within -10% of ATH AND above SMA200 | `quality_growth_screener` (RSI <65) or `momentum_stocks` (RSI ≥65) |
| Correction | SPX -10% to -20% from ATH OR below SMA200 | `quality_stocks` (drawdown > -15%) or `value_stocks` (drawdown ≤ -15%) |
| Bear Market | SPX more than -20% from ATH | `value_stocks` (RSI >35) or `dividend_stocks` (RSI ≤35) |

**Output format:** Regime announcement block (regime, SPX price, ATH drawdown, vs SMA200, recommended strategy), 4-index comparison table, 2–3 sentence rationale, then top 10 screener results.

**Breadth warning:** If Russell 2000 is below its SMA200 while SPX is above, this is flagged as a small-cap breadth divergence.

---

### /macro-dashboard

**What it does:** Fetches 14 assets across four categories in 3 API batches and presents a real-time macro snapshot with interpretations and a synthesized market narrative.

**Assets monitored:**

| Category | Assets |
|----------|--------|
| US Equity | S&P 500, Dow Jones, Nasdaq, Russell 2000 |
| Global Equity | FTSE 100, DAX, Nikkei 225, Hang Seng |
| Macro Signals | VIX, DXY (US Dollar), TNX (10Y yield), Gold, WTI Oil, Bitcoin |

**Interpretation guide:**

- **VIX**: <20 = Calm; 20–30 = Elevated caution; >30 = High fear / market stress
- **DXY**: 1M change >+1% = Strengthening dollar (headwind for commodities & EM); <-1% = Weakening dollar (tailwind for commodities & EM)
- **10Y Yield (TNX)**: <4% = Supportive for equities; 4–5% = High (watch rate sensitivity); >5% = Elevated risk-free competition
- **Gold**: 1M >+3% = Strong safe-haven demand; falling = risk appetite reducing hedging
- **BTC**: 1M >+10% = Risk-On; <-10% = Risk-Off

**Output format:** Three separate tables (US equity, global equity, macro signals), plus auto-generated interpretations and a 3–5 sentence market narrative covering equity tone, risk appetite, dollar/yield environment, and notable divergences.

---

### /portfolio-risk {symbol1} {symbol2} ...

**Usage:** `/portfolio-risk AAPL MSFT AMZN GOOGL NVDA JPM XOM`

Accepts 2–20 symbols (comma- or space-separated).

**What it does:** Fetches beta, volatility, sector, industry, and performance data for all holdings, then produces a concentration and risk analysis assuming equal weights.

**Risk profile classifications:**

| Profile | Criteria |
|---------|----------|
| Conservative | Avg beta <0.8 AND no sector >40% AND avg monthly vol <4% |
| Moderate | Avg beta 0.8–1.2 AND no sector >60% |
| Aggressive | Avg beta >1.2 OR any sector >60% OR avg monthly vol >6% |

**Outputs:**

1. Portfolio overview table (symbol, name, price, market cap, sector, beta, yield, 1Y return)
2. Sector breakdown with concentration flags (>40% = warning, >60% = critical)
3. Industry overlap warnings (2+ holdings in same industry = high correlation risk)
4. Risk metrics: avg portfolio beta, high-beta holdings, avg monthly volatility, dividend income
5. Overall risk profile with top 3 risk factors and top 3 diversification opportunities

---

### /investment-thesis {symbol}

**Usage:** `/investment-thesis NVDA`

**What it does:** Generates a complete, data-driven investment thesis document pre-filled with real market data and Claude's contextual knowledge of the company.

**Sections included:**

1. **The Business** — Sector, industry, market cap, 2–3 sentence company description
2. **Bull Case** — 3 data-driven positive arguments (based on ROE, growth, valuation, FCF, momentum)
3. **Bear Case** — 3 data-driven risk arguments (based on leverage, valuation, technicals, growth)
4. **Key Metrics Table** — 13 metrics with value and tiered assessment (Cheap/Fair/Premium, etc.)
5. **Technical Setup** — Price vs SMA50/SMA200, RSI, 52-week and ATH context, YTD and 1Y returns
6. **Entry/Exit Framework** — Suggested entry zone, stop loss (based on ATR), target, time horizon
7. **What to Monitor** — 3–4 company-specific catalysts and risk factors to track
8. **Analyst Note** — Overall quality score (High Quality / Decent / Mixed) with strongest and weakest factor

**Bull/Bear case generation logic:** Signal rules check specific thresholds (e.g., ROE >15% triggers a competitive advantage point; D/E >1 triggers a leverage risk point). Falls back to the 3 strongest or weakest signals from the data if thresholds are not met.

---

## Workflow Examples

### Example 1: Daily Morning Routine

1. `/macro-dashboard` — check overnight moves, VIX, dollar, and yields
2. `/market-regime` — verify ATH drawdown status for global indexes
3. `/smart-screen` — run the regime-appropriate screener and review top candidates

### Example 2: Stock Deep-Dive

1. `/due-diligence AAPL` — get the full fundamental and technical picture
2. `/compare-peers AAPL MSFT GOOGL` — benchmark against closest competitors
3. `/investment-thesis AAPL` — structure a formal bull/bear thesis before deciding

### Example 3: Portfolio Review

1. `/portfolio-risk AAPL MSFT AMZN NVDA JPM` — check sector concentration and beta exposure
2. `/sector-rotation` — identify which sectors currently have momentum
3. `/run-screener` — find additions from the leading sector to rebalance toward

### Example 4: Rotation-Based Screening

1. `/sector-rotation` — find the top 3 sectors by 1M momentum
2. `/smart-screen` — run the regime-appropriate strategy in the leading sector context
3. `/compare-peers` — compare the top candidates from the screener output
