# Changelog

All notable changes to this project are documented here. Earlier releases are listed on the [GitHub releases page](https://github.com/fiale-plus/tradingview-mcp-server/releases).

## 0.7.2

### Fixed
- **Daily technical analysis was always unavailable.** TradingView's scanner exposes daily recommendation scores as the unsuffixed `Recommend.All`, `Recommend.Other` and `Recommend.MA` columns; the server requested `Recommend.All|1D`, which is always `null`. Since 0.7.0 marks missing scores as `unavailable`, `get_ta_summary` reported every daily timeframe as unavailable and `rank_by_ta` with its default timeframes (`60`, `240`, `1D`, `1W`) excluded every symbol. Daily now maps to the unsuffixed columns; the public timeframe key stays `1D`.
- `lookup_symbols` cache keys no longer depend on symbol order, so the same symbols requested in a different order hit the cache (#21).
- Docs: stale "75+ fields" and "7 strategies" claims updated to 100+ fields and 14 presets.

### Changed
- `@modelcontextprotocol/sdk` updated to 1.32.1; `npm audit fix` applied to transitive dependencies (clears the production audit findings).

### Tests
- Offline test asserting the exact scanner columns requested per timeframe.
- Live integration tests: daily TA must be available for NASDAQ:AAPL, and `rank_by_ta` with default timeframes must rank AAPL, MSFT and NVDA with no exclusions; generic checks accept the documented `unavailable` state.
