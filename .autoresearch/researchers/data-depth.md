# Researcher: data-depth

## Assignment
Research data depth and coverage improvements — new fields, markets, asset classes, derived metrics, and analytical capabilities.

## Summary Statistics
- **Round 1:** 8 findings, all HIGH_VALUE
- **Round 2:** 50 findings — 29 HIGH_VALUE, 15 MEDIUM_VALUE, 1 LOW_VALUE, 4 NOT_FEASIBLE
- **Total HIGH_VALUE:** 37 findings

---

## HIGH_VALUE Findings

### Round 1 (agent: data-depth)

**1. Technical indicators (100+)** (impact:9, feasibility:9, complexity:medium)
Missing: MACD (macd/signal/hist), Bollinger Bands (upper/lower/basis), Stoch.K/D, Stoch.RSI.K/D, CCI20, Williams %R (W.R), Parabolic SAR (P.SAR), Ichimoku (BLine/CLine/Lead1/Lead2), Aroon.Up/Down, AO (Awesome Oscillator), HullMA, Momentum (Mom), ROC, ChaikinMoneyFlow, BBPower, 30+ EMA/SMA variants, Pivot Points (Classic/Fibonacci/Woodie/Camarilla), 25+ candle patterns. All support timeframe pipe notation.

**2. Multi-timeframe analysis** (impact:8, feasibility:9, complexity:medium)
API supports pipe notation: RSI|60 (hourly RSI), MACD.macd|240 (4h MACD). Timeframes: 1m, 5m, 15m, 30m, 1h, 2h (120), 4h (240), 1W, 1M. Zero awareness currently in MCP server.

**3. Fundamental fields (20+)** (impact:9, feasibility:10, complexity:low)
Missing: total_shares_outstanding_fundamental, float_shares_outstanding, float_shares_percent_current, price_free_cash_flow_ttm, earnings_yield, buyback_yield, share_buyback_ratio_fq/fy, ROIC, interst_cover_fy, net_debt_to_ebitda_fy, book_value_per_share_fy, book_tangible_per_share_fy, cash_per_share_fy.

**4. Analyst ratings & estimates** (impact:10, feasibility:10, complexity:low)
ZERO currently exposed. Available: Recommend.All/MA/Other, price_target_average/high/low/median/1y, recommendation_buy/hold/sell/over/under/total (analyst counts), earnings_per_share_forecast_next_fq/fy, revenue_forecast_next_fq/fh/fy, eps_surprise_fq/percent_fq, revenue_surprise_fq/percent_fq.

**5. Earnings data (30+)** (impact:9, feasibility:10, complexity:low)
Missing: earnings_per_share_diluted_yoy_growth_fq, earnings_per_share_diluted_qoq_growth_fq, earnings_per_share_diluted_yoy_growth_fy, earnings_per_share_basic_ttm, earnings_per_share_fq, earnings_release_time, ipo_offer_date. EPS growth per quarter detects acceleration/deceleration faster than TTM.

**6. Revenue data (20+)** (impact:8, feasibility:10, complexity:low)
Missing: total_revenue_fq, total_revenue_fy, total_revenue_qoq_growth_fq (QoQ sequential growth), total_revenue_5y_growth_fy, earnings_per_share_diluted_5y_growth_fy. QoQ revenue growth detects deceleration before it shows in TTM/YoY.

**7. ETF fields** (impact:9, feasibility:9, complexity:medium)
Missing: expense_ratio, aum, nav, nav_discount_premium, etf_holdings_count, weight_top_10/25/50, leverage_factor, is_leveraged, is_inverse. Currently uses generic stock fields only.

**8. Crypto fields (60+)** (impact:9, feasibility:9, complexity:medium)
Missing: addresses_active/new/total, txs_count, txs_volume_usd, large_tx_count, circulating_supply, total_supply, max_supply, circulating_to_max_supply_ratio, telegram_members, twitter_positive/negative, social_volume_24h, socialdominance, tvl, market_cap_to_tvl, nvt, dex_total_liquidity, dex_trading_volume_24h, altrank, galaxyscore, github_commits, crypto_consensus_algorithms, crypto_blockchain_ecosystems, market_cap_diluted_calc, fully_diluted_value.

---

### Round 2 (agent: data-depth-r2)

**9. Index membership fields** (impact:8, feasibility:9, complexity:low) — Cycle 3
Fields: `index` (which index), `indexes` (array of index memberships), `index_id`, `index_priority`, `index_provider`. Enables "show me S&P 500 stocks with RSI < 30" screening. Currently zero index fields exposed.

**10. Dividend-specific fields** (impact:8, feasibility:10, complexity:low) — Cycle 6
Critical missing: `continuous_dividend_growth` (years of growth — Dividend Aristocrat screening!), `continuous_dividend_payout`, `dividend_ex_date_upcoming`, `dividend_payment_date_upcoming`, `dps_common_stock_prim_issue_yoy_growth_fy` (dividend growth rate), `indicated_annual_dividend`, `dividends_per_share_fq`. Enables Dividend Aristocrats preset.

**11. 52-week and ATH fields** (impact:7, feasibility:10, complexity:low) — Cycle 7
Confirmed: `price_52_week_high`, `price_52_week_low`, `price_52_week_high_date`, `price_52_week_low_date`, `all_time_high`, `all_time_low`, `all_time_high_day`, `all_time_low_day`, `Low.After.High.All` (drawdown from ATH). Used in lookupSymbols but absent from STOCK_FIELDS for screening. Enable breakout and mean-reversion screeners.

**12. Analyst rating reconfirmation** (impact:10, feasibility:10, complexity:low) — Cycle 9
Exact field names confirmed: `Recommend.All`, `Recommend.MA`, `Recommend.Other`, `price_target_1y`, `price_target_average`, `price_target_high`, `price_target_low`, `price_target_median`.

**13. Extended performance timeframes** (impact:7, feasibility:10, complexity:low) — Cycle 10
Missing: `Perf.5D` (5-day), `Perf.6M` (6-month), `Perf.3Y` (3-year), `Perf.5Y` (5-year), `Perf.10Y` (10-year), `Perf.All` (all-time). Currently only W/1M/3M/Y/YTD exposed. Multi-timeframe momentum screening requires these.

**14. Analyst estimate fields** (impact:9, feasibility:10, complexity:low) — Cycle 11
Confirmed: `recommendation_buy/hold/sell/over/under/total`, `earnings_per_share_forecast_next_fq/fy`, `revenue_forecast_next_fq/fh/fy`, `eps_surprise_fq/percent_fq`, `revenue_surprise_fq/percent_fq`. ZERO of these are currently exposed.

**15. Volume and dollar volume fields** (impact:8, feasibility:10, complexity:low) — Cycles 12, 45
Missing: `relative_volume_10d_calc` (KEY for breakout screening), `VWAP`, `premarket_volume`, `postmarket_volume`, `volume_change`, `volume_change_abs`, `average_volume_10d_calc`, `average_volume_30d_calc`, `average_volume_60d_calc`, `Value.Traded` (dollar volume), `AvgValue.Traded_10d/30d/60d/90d`. Dollar volume (AvgValue.Traded_30d) is superior to share volume for institutional liquidity filtering.

**16. Pre-market and post-market fields** (impact:7, feasibility:10, complexity:low) — Cycle 13
Confirmed: `premarket_change`, `premarket_close`, `premarket_gap`, `premarket_volume`, `premarket_high/low/open`, `postmarket_change`, `postmarket_close`, `postmarket_high/low/open/volume`. Gap fields: `gap`, `gap_up`, `gap_down`. Also missing basic session fields: `open`, `high`, `low`, `change_from_open`. 20+ new intraday/extended-hours fields.

**17. Balance sheet fields** (impact:8, feasibility:10, complexity:low) — Cycle 14
Missing: `net_debt_fq`, `working_capital_fq`, `cash_n_equivalents_fq/fy`, `book_value_per_share_fy`, `book_tangible_per_share_fy`, `cash_per_share_fy`, `interst_cover_fy` (interest coverage), `net_debt_to_ebitda_fy`, `capital_expenditures_fy`, `long_term_debt_fy`, `shrhldrs_equity_fy`, `total_liabilities_fy`.

**18. Income statement fields** (impact:7, feasibility:10, complexity:low) — Cycle 15
Missing: `gross_profit_fq`, `oper_income_fy/fq` (operating income/EBIT), `ebit_ttm`, `net_income_fy/fq/ttm`, `total_revenue_fq/fy`, `total_revenue_qoq_growth_fq`. QoQ sequential revenue growth detects deceleration faster than YoY.

**19. Technical indicators reconfirmation** (impact:9, feasibility:9, complexity:medium) — Cycle 16
Exact field names: `MACD.macd`, `MACD.signal`, `MACD.hist`, `BB.upper/lower/basis` (+ 50-period variants), `Stoch.K/D`, `Stoch.RSI.K/D`, `CCI20`, `W.R`, `P.SAR`, `Ichimoku.BLine/CLine/Lead1/Lead2`. RSI has 9 period variants: RSI2/3/5/7/9/10/14/20/21/30.

**20. Composite scoring fields** (impact:9, feasibility:10, complexity:low) — Cycle 17 ⭐ MAJOR FIND
`piotroski_f_score_fy/ttm` (Piotroski F-Score 0-9, fundamental quality), `altman_z_score_fy/ttm` (bankruptcy prediction), `zmijewski_score_fy/ttm` (financial distress). Pre-computed composite scores. "Piotroski > 7 + low P/B" is classic value factor screen. Enables sophisticated quality filtering without combining 9 individual metrics.

**21. Efficiency/turnover fields** (impact:7, feasibility:10, complexity:low) — Cycle 19
Missing: `asset_turnover_fy/current`, `invent_turnover_fy/current`, `receivables_turnover_fq/fy`, `fixed_assets_turnover_fq/fy`, `research_and_dev_fy/fq` (absolute R&D), `research_and_dev_per_employee_fy`. Complete DuPont analysis capability.

**22. Calendar/IPO fields** (impact:7, feasibility:10, complexity:low) — Cycle 20
Missing: `ipo_offer_date` (enables recent IPO screens), `earnings_release_time` (before/after market), `earnings_per_share_diluted_yoy_growth_fq`, `earnings_per_share_diluted_qoq_growth_fq` (sequential EPS).

**23. Multi-year CAGR fields** (impact:7, feasibility:10, complexity:low) — Cycle 22
`total_revenue_5y_growth_fy` (5-year revenue growth), `earnings_per_share_diluted_5y_growth_fy` (5-year EPS CAGR). Standard GARP screening metrics. `change_abs` (absolute price change in $).

**24. Bond scanner endpoint** (impact:8, feasibility:7, complexity:medium) — Cycle 24
`scanner.tradingview.com/bonds/scan` confirmed, 1,129 government bonds (TVC:US10Y, TVC:DE10Y pattern). Adding screen_bonds tool enables yield curve analysis, sovereign debt comparison, macro regime detection.

**25. Futures scanner endpoint** (impact:8, feasibility:7, complexity:medium) — Cycle 25
`scanner.tradingview.com/futures/scan` confirmed, 55,278 contracts across EUREX/NYMEX/CME/ICE/CBOT. Enables commodity screening (crude, gold, agricultural), interest rate futures, equity index futures. Fields include open_interest, basis likely.

**26. Crypto fields reconfirmation with exact names** (impact:9, feasibility:9, complexity:medium) — Cycle 26
Exact: `addresses_active`, `txs_count`, `txs_volume_usd`, `large_tx_count`, `circulating_supply`, `circulating_to_max_supply_ratio`, `telegram_members`, `twitter_positive/negative`, `social_volume_24h`, `socialdominance`, `tvl`, `market_cap_to_tvl`, `nvt`, `dex_total_liquidity`, `dex_trading_volume_24h`, `altrank`, `galaxyscore`, `github_commits`.

**27. Candlestick pattern fields** (impact:7, feasibility:9, complexity:low) — Cycle 29
25+ confirmed: `Candle.Hammer`, `Candle.Engulfing.Bullish/Bearish`, `Candle.Doji`, `Candle.Doji.Dragonfly/Gravestone`, `Candle.MorningStar`, `Candle.EveningStar`, `Candle.3WhiteSoldiers`, `Candle.3BlackCrows`, `Candle.ShootingStar`, `Candle.HangingMan`, `Candle.Marubozu.Black/White`, `Candle.Harami.Bullish/Bearish`, `Candle.AbandonedBaby.Bullish/Bearish`, `Candle.TriStar.Bullish/Bearish`. Support timeframe pipe notation.

**28. Additional moving average variants** (impact:8, feasibility:10, complexity:low) — Cycle 30
29 EMA variants (EMA2-EMA300), 29 SMA variants (SMA2-SMA300). Currently only SMA50, SMA200, EMA10 exposed. Key missing: EMA20, EMA21 (Minervini/IBD standard), EMA200, SMA20, SMA100. `BBPower` (Elder Bull Bear Power) unique to TradingView.

**29. Missing operators** (impact:9, feasibility:9, complexity:low) — Cycle 41 ⭐ MAJOR FIND
10 operators MISSING from OPERATOR_MAP: `above%` (price X% above MA), `below%`, `in_range%`, `not_in_range%`, `has` (set contains), `has_none_of` (set excludes), `nmatch` (not match), `empty` (is null), `nempty` (is not null), `in_day_range`/`in_week_range`/`in_month_range` (date ranges). One-line-per-operator fix, massive capability multiplier.

**30. Forward valuation fields** (impact:7, feasibility:10, complexity:low) — Cycle 36
Missing: `price_earnings_forward_fy` (forward P/E), `earnings_yield`, `enterprise_value_to_revenue_ttm` (EV/Revenue for SaaS/growth), `price_revenue_ttm`.

**31. Graham Number** (impact:9, feasibility:10, complexity:low) — Cycle 37 ⭐ MAJOR FIND
`graham_numbers_fy` and `graham_numbers_ttm` — TradingView computes Benjamin Graham's intrinsic value natively. `close < graham_numbers_ttm` = classic deep value filter. Also: `free_cash_flow_per_share_ttm/fq/fy` (P/FCF calculation). None in STOCK_FIELDS.

**32. OR filter logic (filter2)** (impact:8, feasibility:8, complexity:medium) — Cycle 35 ⭐ MAJOR FIND
`filter2` parameter in API supports OR logic for nested operations. MCP server is AND-only. Adding `filter_logic: 'and'|'or'` parameter enables disjunctive screens: "sector = Tech OR sector = Healthcare", "RSI < 30 OR price at 52w low". Critical capability gap.

**33. Set operators for typespecs/indexes** (impact:7, feasibility:9, complexity:low) — Cycle 34
Missing operators: `has` and `has_none_of` for set-type fields. Enables `typespecs has 'common'` (common stocks only), `typespecs has_none_of 'preferred'` (exclude preferred), `indexes has 'S&P 500'` (index constituent filter).

**34. Index constituent screening via preset** (impact:7, feasibility:8, complexity:medium) — Cycle 44
`preset` parameter in request body (`index_components_market_pages`) enables native index constituent queries. Adding `index` parameter to screen tools could constrain searches to S&P 500, Russell 2000, etc. — standard institutional use case.

**35. CFD scanner endpoint** (impact:6, feasibility:7, complexity:medium) — Cycle 33
`scanner.tradingview.com/cfd/scan` confirmed, 650 instruments (crypto, forex, indices, commodities). Single cross-asset scan for macro overview (gold, oil, SPX, DXY, BTC together). `scanner.tradingview.com/coin/scan` confirmed (2,998 CRYPTO: prefix pairs).

**36. price_free_cash_flow_ttm** (impact:6, feasibility:10, complexity:low) — Cycle 49
P/FCF ratio confirmed available. Critical for Buffett-style cash-generative business screening. `enterprise_value_to_revenue_ttm` also confirmed.

---

## MEDIUM_VALUE Findings (Round 2)

**Forex-specific fields** (impact:5, cycle:1) — `bid_ask_spread_pct`, `forex_priority/minor_priority/exotic_priority`, `base_currency_kind`. No interest rate or carry data available.

**Float and buyback fields** (impact:6, cycle:4) — `float_shares_outstanding`, `float_shares_percent_current`, `buyback_yield`, `share_buyback_ratio_fq/fy`. Shareholder return analysis.

**Employee metrics** (impact:5, cycle:5) — `number_of_employees_fy`, `revenue_per_employee_fy`, `net_income_per_employee_fy`, `ebitda_per_employee_fy`. Volatility variants: `Volatility.D`, `Volatility.W`.

**Country-specific endpoints** (impact:5, cycle:27) — `/america/scan`, `/uk/scan`, `/germany/scan` etc. confirmed. Single-market queries possibly faster. Key value: documenting available market identifiers.

**Country and ADR fields** (impact:5, cycle:28) — `country` field enables geographic origin screening (US-listed Chinese companies). `subtype` may classify ADRs.

**Pivot point fields** (impact:6, cycle:18) — Classic/Fibonacci/Woodie/Camarilla pivots (32 fields). Monthly pivots confirmed (`Pivot.M.*`). Useful for support/resistance screening.

**Period high/low fields** (impact:6, cycle:43) — `High.1M/3M/6M`, `Low.1M/3M/6M`, `change_from_open`. Period breakout reference levels.

**Quarterly fundamental period variants** (impact:5, cycle:42) — Additional FQ/FY variants for existing metrics. Enables detecting quarter-over-quarter fundamental deterioration.

**Cash flow statement completeness** (impact:6, cycle:46) — `cash_f_operating_activities_fy/ttm`, `capital_expenditures_fy/ttm`. OCF vs net income earnings quality signal.

**EV/Revenue** (impact:5, cycle:47) — `enterprise_value_to_revenue_ttm`, market_cap historical change variants.

**Percentile ranking (client-side)** (impact:6, cycle:32) — Not available natively but implementable client-side. High complexity.

**Pagination support** (impact:6, cycle:40) — `preset` parameter for index queries. Range parameter is [start, end] not [0, limit] — offset=0 currently hardcoded.

**Forex bid-ask spread** (impact:5, cycle:1) — Available for forex but not for stocks.

**CFD endpoint** (impact:6, cycle:33) — Cross-asset spot instruments for macro view.

**Security type filtering** (impact:5, cycle:38, 44) — `typespecs` values: common, preferred, dr, etf. `symbols.query.types` for market type filtering.

---

## LOW_VALUE Findings (Round 2)

**Company description text** (impact:4, cycle:48) — `description` field with `match` operator for text search. Inconsistent data quality limits utility.

---

## NOT_FEASIBLE Findings (Round 2)

**ESG/sustainability scores** (cycle:2) — Not available in TradingView scanner. Would require MSCI/Sustainalytics integration.

**Supply chain data** (cycle:23) — Relational company data not available through scanner API.

**Seasonality patterns** (cycle:31) — Requires historical OHLC aggregation not available in scanner.

**Economy/macro scanner** (cycle:39) — economic-calendar.tradingview.com requires authentication (403). Not accessible publicly.

---

## Implementation Priority Ranking

### Tier 1 — Immediate (1-2 days, lowest complexity, highest ROI)
1. **Add 10 missing operators** — `above%`, `below%`, `in_range%`, `has`, `has_none_of`, `empty`, `nempty`, `nmatch`, `in_day_range`, `in_week_range` — one-line each in OPERATOR_MAP
2. **Composite scoring fields** — `piotroski_f_score_ttm`, `altman_z_score_ttm`, `graham_numbers_ttm` — 3 fields, instant differentiation
3. **Analyst data** — `Recommend.All`, `price_target_average`, `recommendation_buy/sell/hold`, `eps_surprise_percent_fq` — 8 fields
4. **Performance completeness** — `Perf.5D`, `Perf.6M`, `Perf.3Y`, `Perf.5Y`, `Perf.10Y`, `Perf.All` — 6 fields
5. **Relative volume** — `relative_volume_10d_calc`, `AvgValue.Traded_30d` (dollar volume) — 2 critical fields

### Tier 2 — Short-term (1 week)
6. **Balance sheet fields** — net_debt, working_capital, interest_coverage, net_debt_to_ebitda — 6 fields
7. **Dividend fields** — continuous_dividend_growth, dividend_ex_date_upcoming, dps_*_yoy_growth_fy — 5 fields
8. **52-week/ATH fields** — price_52_week_high/low, all_time_high/low — 4 fields
9. **Forward valuation** — price_earnings_forward_fy, earnings_yield, enterprise_value_to_revenue_ttm — 3 fields
10. **OR filter logic** — filter2 parameter support in API requests

### Tier 3 — Medium-term (2-4 weeks)
11. **Technical indicator sub-fields** — MACD, BB, Stochastic, Ichimoku with timeframe notation
12. **Candlestick patterns** — 25 pattern fields
13. **Extended MA variants** — EMA20/21/200, SMA20/100
14. **Pre/post-market fields** — premarket_change/volume, gap fields
15. **New endpoints** — screen_bonds, screen_futures tools

### Tier 4 — Long-term
16. **Crypto-specific field list** — 60+ on-chain, social, DeFi fields
17. **ETF-specific fields** — expense_ratio, AUM, NAV
18. **Index constituent screening** — preset parameter support
19. **Client-side percentile ranking** — compute ranks from result sets

---

## Key Insight
The TradingView scanner API supports 3,000+ fields. This MCP server exposes ~60 (2%). The three biggest bang-for-buck improvements are:
1. **10 missing operators** (especially `above%`, `below%`, `has`) — each enables entirely new screening patterns
2. **3 composite scores** (Piotroski, Altman Z, Graham Number) — unique pre-computed signals not found in most screeners
3. **OR filter logic** (filter2) — doubles the expressive power of every existing field
