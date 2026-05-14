# Researcher: new-tools

## Assignment
Research new tools and capabilities that would make the TradingView MCP Server more useful for potential users.

## Summary
- **Round 1:** 7 findings (6 HIGH_VALUE, 1 MEDIUM_VALUE)
- **Round 2:** 50 findings (28 HIGH_VALUE, 8 MEDIUM_VALUE, 4 LOW_VALUE, 10 NOT_FEASIBLE)
- **Combined HIGH_VALUE:** 34 findings
- **Combined MEDIUM_VALUE:** 9 findings

---

## HIGH_VALUE Findings (34 total)

### New Tool Ideas

1. **technical_rating** (impact:9, feasibility:10, complexity:low) — TradingView composite buy/sell recommendations from 26 indicators (Recommend.All/MA/Other). Available as columns, supports multi-timeframe. Returns Strong Sell → Strong Buy labels. [R1-C10]

2. **analyst_consensus** (impact:9, feasibility:10, complexity:low) — Analyst buy/hold/sell counts, average/high/low price targets, compute % upside to mean target. Fields confirmed: recommendation_buy/hold/sell/total, price_target_average/high/low. Extends technical_rating concept to include street analyst data. [R2-C30]

3. **compare_stocks** (impact:8, feasibility:9, complexity:low) — Side-by-side comparison with computed rankings and delta percentages. Builds on existing lookup_symbols infrastructure. [R1-C9, confirmed]

4. **portfolio_analysis** (impact:8, feasibility:8, complexity:medium) — Accept holdings (symbol+shares+cost), fetch prices/fundamentals, compute sector allocation, weighted P/E, beta, total return. [R1-C7]

5. **earnings_calendar** (impact:7, feasibility:9, complexity:low) — earnings_release_next_trading_date_fq field exists. Specialized lookup with calendar-oriented formatting. [R1-C6]

6. **market_breadth** (impact:8, feasibility:8, complexity:medium) — Compute breadth indicators from broad screen: % stocks above SMA200/SMA50, new 52-week high/low counts, % with RSI>50. Run on full universe (limit=200). Returns breadth dashboard for market regime assessment. [R2-C7]

7. **custom_composite_scoring** (impact:9, feasibility:9, complexity:medium) — Accept symbols + {field: weight} scoring config, fetch raw data, normalize fields to percentile ranks, compute weighted composite score, return ranked results. Enables systematic multi-factor ranking. [R2-C8]

8. **compare_to_peers** (impact:9, feasibility:9, complexity:medium) — Auto-detect peer group (same sector/industry, similar market cap 0.3x-3x), compute target stock's percentile rank vs peers for each metric. 2 API calls: lookup target, screen peers. Core relative valuation tool. [R2-C9]

9. **factor_exposure** (impact:8, feasibility:9, complexity:medium) — Factor profile computing standardized Value/Momentum/Quality/Size scores from scanner fields. Returns factor exposure for individual stock or portfolio. Canonical academic factor definitions. [R2-C19]

10. **dcf_estimator** (impact:7, feasibility:7, complexity:medium) — Fetch FCF, growth rates, beta, shares_outstanding; compute intrinsic value per share under bear/base/bull scenarios. Client-side DCF using scanner data. [R2-C17]

11. **alert_condition_checker** (impact:7, feasibility:10, complexity:low) — Accept list of {symbol, field, operator, value} conditions, fetch current values via lookup_symbols, return which conditions are triggered. Thin wrapper over existing infrastructure. [R2-C49]

12. **piotroski_score** (impact:8, feasibility:7, complexity:medium) — Compute ~7 of 9 Piotroski F-Score criteria from available fields (ROA, CFO proxy via FCF, current_ratio, gross_margin, debt_to_equity, shares_outstanding). Returns score + high-f-score preset. [R2-C38]

13. **yield_curve_analysis** (impact:7, feasibility:8, complexity:medium) — Fetch government bonds across maturities (2yr, 5yr, 10yr, 30yr) for US/EU/UK/JP via /bond/scan, compute 2s10s spread, identify inversions. Critical macro indicator. [R2-C44]

14. **list_markets** (impact:8, feasibility:10, complexity:low) — Static tool returning all 50+ valid market identifiers with country/exchange metadata. Directly addresses discoverability gap. TradingView confirmed markets: america, canada, uk, germany, france, japan, australia, india, hong_kong, china, south_korea, brazil, and 40+ more. [R2-C43]

15. **multi_timeframe_screen** (impact:8, feasibility:9, complexity:medium) — Add timeframe parameter to filter objects; append |timeframe to field names before sending to API. Enables RSI|1D > 50 AND RSI|1W > 60 in single query. Validated via pipe notation in TradingView API. [R2-C4]

16. **relative_strength_ranking** (impact:8, feasibility:8, complexity:medium) — Fetch target stocks + benchmark (SPX) performance across periods, compute RS = stock_perf - benchmark_perf, rank descending. Optionally vs sector ETF. [R2-C16]

17. **event_screen** (impact:8, feasibility:8, complexity:medium) — Date-aware screening: find stocks with earnings in next 7/14/30 days using earnings_release_next_trading_date_fq + client-side date arithmetic. Additional filter support for pre-earnings opportunities. [R2-C22]

18. **fundamental_trend** (impact:8, feasibility:9, complexity:low) — Fetch QoQ+YoY growth fields for revenue, EPS, FCF, margins for a symbol. Show acceleration/deceleration pattern. Fields confirmed: total_revenue_qoq_growth_fq, EPS_growth variants exist in API. [R2-C23]

### New Presets

19. **New investment style presets** (impact:8, feasibility:10, complexity:low) — Add 7+ presets: GARP (PEG<1.5, ROE>15%, rev_growth>10%), Deep Value (P/B<1, P/E<10), Quality Compounder (gross_margin>40%, ROIC>20%, FCF>15%), Dividend Aristocrat proxy, Turnaround, Small Cap Quality, International Value. Pure additions to presets.ts. [R2-C35]

20. **quality_compounder preset** (impact:9, feasibility:9, complexity:low) — The highest-value single preset: gross_margin>40%, ROIC>20%, FCF margin>15%, debt/equity<0.5, revenue growth>8%. Quintessential Munger/Buffett screen for the target "patient systematic investor" user. [R2-C50]

21. **sector_rotation preset/tool** (impact:8, feasibility:9, complexity:low) — Fetch SPDR sector ETFs (XLK, XLF, XLE, XLV, etc.) performance across periods, rank by momentum, classify offensive vs defensive sectors. New preset or lookup workflow. [R2-C18]

22. **unusual_activity presets** (impact:7, feasibility:10, complexity:low) — Three new presets: unusual_volume (volume > 3x 90d avg), big_movers (|change| > 5%), gap_ups (change_from_open > 3% + volume spike). All using existing fields. [R2-C15]

23. **breakout_scanner presets** (impact:7, feasibility:10, complexity:low) — Three new presets: 52week_high_breakout (near 52w high + volume), all_time_high_momentum, golden_cross_fresh (crosses_above operator). Zero new infrastructure. [R2-C41]

24. **stealth_accumulation preset** (impact:7, feasibility:9, complexity:low) — Volume/avg > 1.5 AND low Volatility.M AND RSI in [40,55] AND close > SMA200. Detects potential institutional buying before price moves. [R2-C33]

25. **low_volatility preset** (impact:6, feasibility:10, complexity:low) — Volatility.M < 1.5, beta < 0.7, market_cap > 5B, dividend_yield > 1.5%. Targets defensive low-volatility factor (SPLV/USMV-style). [R2-C40]

26. **macro_dashboard preset** (impact:8, feasibility:9, complexity:low) — Lookup key macro indicators: VIX, DXY, Gold, Oil, 10Y yield (TVC:TNX), yield curve spread. Provides economic context alongside market_indexes. [R2-C48]

27. **emerging_markets preset** (impact:7, feasibility:9, complexity:low) — Quality filters applied to EM markets (BSE, BMFBOVESPA, KRX, TWSE, SSE). Enables global equity screening beyond America. [R2-C42]

28. **reit_quality preset** (impact:7, feasibility:7, complexity:medium) — Sector='Real Estate' with P/FFO, FFO/share, dividend_yield > 3% filters. REITs need different metrics than general stocks. Requires FFO field verification. [R2-C39]

29. **financial_health preset** (impact:7, feasibility:9, complexity:low) — Add interest_cover_ttm, net_debt, quick_ratio fields + preset: current_ratio > 1.5, interest_coverage > 5, net_debt/EBITDA < 2. Enables proper debt quality screening. [R2-C36]

30. **dividend_growth preset** (impact:7, feasibility:8, complexity:medium) — DPS multi-period fields for growth rate computation + preset: yield > 2% AND dividend_growth > 5% AND payout < 60%. Dividend Aristocrat-style screen. [R2-C34]

31. **total_shareholder_yield preset** (impact:7, feasibility:7, complexity:medium) — dividend_yield + buyback_yield = total shareholder yield. Requires buyback_yield field verification. Screens for shareholder-friendly capital allocation. [R2-C46]

### Field Catalog Additions

32. **Expose 20+ technical indicators** (impact:9, feasibility:9, complexity:low) — MACD, Stochastic, CCI, Williams %R, BBands, Recommend.All already in API. Just needs field definitions. [R1-C9]

33. **Crypto DeFi + on-chain fields** (impact:9, feasibility:9, complexity:medium) — Add 40+ crypto-specific fields: on-chain (addresses_active, txs_count), DeFi (TVL, market_cap_to_tvl), social sentiment (twitter_positive, social_volume), supply (circulating_supply, inflation_rate). Fields confirmed in API. [R2-C47]

34. **Volatility field variants** (impact:6, feasibility:10, complexity:low) — Add Volatility.D, Volatility.W to field catalog alongside existing Volatility.M. [R2-C40, part]

---

## MEDIUM_VALUE Findings (9 total)

35. **screen_bonds** (impact:6, feasibility:8, complexity:low) — TradingView /bond/scan endpoint confirmed. Yield, maturity, duration filtering. [R1-C8]

36. **watchlist management** (impact:5, feasibility:7, complexity:medium) — In-memory session-scoped named symbol lists. Limited by MCP statelessness; better served by filesystem MCP composition. [R2-C1]

37. **session snapshots + diff** (impact:5, feasibility:6, complexity:medium) — Session-scoped snapshot-and-diff for screening results. Run screen → save → re-run → diff for entrants/exits/rank changes. [R2-C2]

38. **index constituent screening** (impact:7, feasibility:6, complexity:medium) — Maintain static S&P 500/Nasdaq 100/Russell 2000 symbol lists, pass to symbols.tickers. Requires periodic constituent list maintenance. [R2-C10]

39. **candlestick pattern screening** (impact:6, feasibility:7, complexity:medium) — Pattern.* fields (Doji, Hammer, Engulfing) exist in scanner API. Add to field catalog + candle_pattern preset. Complex chart patterns (C&H, H&S) not feasible. [R2-C24]

40. **CMF/OBV fields** (impact:6, feasibility:6, complexity:medium) — Chaikin Money Flow, On-Balance Volume likely available as technical fields. Add to field catalog. [R2-C12]

41. **analyst revision proxy** (impact:6, feasibility:5, complexity:medium) — True revision tracking not possible; analyst consensus skew (% strong buy) + price target vs current = proxy. Add analyst consensus fields. [R2-C45]

42. **short squeeze screen** (impact:6, feasibility:7, complexity:low) — short_percent_of_float, short_ratio, days_to_cover fields likely in API. Add fields + short_squeeze preset. Data is bi-monthly (somewhat stale). [R2-C31]

43. **dividend calendar** (impact:7, feasibility:6, complexity:medium) — Ex-dividend date field existence unconfirmed in scanner API. Similar to earnings_calendar if field exists. [R2-C14]

---

## LOW_VALUE Findings (4 total)

44. **geographic diversification** (impact:5, complexity:low) — Better as feature of portfolio_analysis than standalone tool. [R2-C13]

45. **currency impact analysis** (impact:5, complexity:medium) — Directional analysis only using fundamental_currency_code + forex pairs. Better served by documentation. [R2-C26]

46. **backtest export** (impact:4, complexity:medium) — Backtesting requires historical OHLCV not available from scanner. Current JSON output already serves snapshot export needs. [R2-C27]

47. **liquidity analysis tool** (impact:4, complexity:low) — Well-served by existing volume/market_cap filters. Better as preset than standalone tool. [R2-C20]

---

## NOT_FEASIBLE Findings (10 total)

48. **correlation analysis** (impact:4) — True pairwise price correlation requires time-series data not in scanner API. Only 4-5 period returns available — statistically meaningless. [R2-C3, C25]

49. **insider trading data** (impact:7) — TradingView scanner has no insider trading fields (Form 4 data). Requires SEC EDGAR integration. [R2-C5]

50. **IPO tracking** (impact:5) — TradingView IPO calendar uses internal non-public endpoints. Scanner API has no IPO-specific fields. [R2-C6]

51. **risk metrics (Sharpe/Sortino/MaxDD)** (impact:7) — Requires time-series price history not in scanner API. [R2-C11]

52. **seasonal pattern analysis** (impact:5) — Requires multi-year monthly return history not in scanner API. [R2-C21]

53. **supply/demand zones** (impact:3) — Requires OHLCV time-series data. Not available from snapshot API. [R2-C28]

54. **ETF overlap detection** (impact:6) — ETF constituent/holdings data not in TradingView scanner. Requires separate ETF holdings provider. [R2-C29]

55. **news sentiment (stocks)** (impact:5) — No news sentiment fields in stock scanner. Crypto social sentiment IS available and should be added. [R2-C37]

56. **options data** (impact:7) — Options (IV, put/call ratio, Greeks) not in TradingView scanner API. Requires separate options data provider. [R2-C32]

57. **true earnings revision tracking** (impact:7) — Requires historical snapshot of analyst estimates over time. Only current estimates available. [R2-C45, partial]

---

## Dead Ends
- True time-series analysis (correlation, Sharpe, seasonal) — scanner is snapshot-only
- ETF holdings/constituent data — not in scanner
- Options data — separate product from scanner
- Insider trading — SEC Form 4 data, requires external source
- IPO calendar — internal TradingView endpoint, not public

## Priority Implementation Order (by impact × feasibility)

**Immediate (low complexity, high impact):**
1. quality_compounder preset (+ GARP, Deep Value, Turnaround presets)
2. analyst_consensus tool (fields confirmed, low complexity)
3. list_markets tool (static data, trivial)
4. unusual_activity + breakout presets
5. fundamental_trend tool (QoQ/YoY growth fields)
6. macro_dashboard preset
7. alert_condition_checker (thin wrapper over lookup_symbols)
8. sector_rotation preset
9. emerging_markets preset + financial_health preset

**Medium term (medium complexity, high impact):**
10. compare_to_peers tool (2 API calls, client-side ranking)
11. custom_composite_scoring tool
12. multi_timeframe_screen (pipe notation field modifier)
13. market_breadth tool
14. relative_strength_ranking
15. event_screen tool (date arithmetic on earnings dates)
16. factor_exposure tool
17. crypto DeFi field additions (40+ on-chain fields)

**Longer term (higher complexity):**
18. portfolio_analysis tool
19. piotroski_score tool
20. dcf_estimator tool
21. yield_curve_analysis (bond endpoint)
22. dividend_growth analysis
23. REIT preset + FFO fields
