# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TradingView MCP Server is an unofficial Model Context Protocol server **and CLI tool** that provides access to TradingView's market screener API. It enables AI-powered stock, forex, crypto, and ETF screening through Claude Desktop, Claude Code, or the standalone `tradingview-cli` command.

## Build and Development Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run dev          # Run MCP server directly with tsx (no build step)
npm run dev:cli      # Run CLI directly with tsx (no build step)
```

### Running a single test file
```bash
npm test -- fields.test.ts
```

### Development workflow
For local development, use `npm run dev` which runs TypeScript directly via tsx without requiring a build step. After making changes:
1. Restart Claude to reload the MCP server (no hot-reload)
2. Test via Claude's MCP integration

## Architecture

### Dual Entry Points
The package has two entry points sharing all core logic:

**MCP Server** — `src/index.ts`
Creates the MCP server, registers tools and resources, handles tool calls via stdio. Initializes core components:
- `TradingViewClient` - API client
- `Cache` - Response caching (configurable TTL)
- `RateLimiter` - Request throttling (configurable RPM)
- `ScreenTool`, `FieldsTool`, `PresetsTool` - Tool implementations

**CLI** — `src/cli.ts`
Standalone CLI using Node's built-in `util.parseArgs`. Reuses the same tool classes. Output formats: JSON (default), CSV, table. No `cache.startCleanup()` (CLI is short-lived).

Experimental CLI commands require `TV_EXPERIMENTAL_ENABLED=1`:
```bash
TV_EXPERIMENTAL_ENABLED=1 tradingview-cli experimental bars BINANCE:BTCUSDT --timeframe 60
TV_EXPERIMENTAL_ENABLED=1 tradingview-cli experimental stream-quotes NASDAQ:AAPL --duration 10
TV_EXPERIMENTAL_ENABLED=1 tradingview-cli experimental stream-bars BINANCE:BTCUSDT --timeframe 1 --duration 30
```

**CLI Helpers** (`src/cli/`)
- `parseArgs.ts` - Option configs, input builders, preset merging
- `formatters.ts` - JSON/CSV/table output formatters
- `help.ts` - Help text for all commands

### Core Components

**API Layer** (`src/api/`)
- `client.ts` - HTTP client for TradingView scanner API endpoints (`/global/scan`, `/forex/scan`, `/crypto/scan`)
- `search.ts` - Symbol search via TradingView symbol-search v3 endpoint
- `metainfo.ts` - Market metainfo via scanner `/metainfo` endpoint
- `ta.ts` - Technical analysis summary and ranking via scanner Recommend.All/Other/MA fields
- `types.ts` - TypeScript interfaces for API requests/responses

**WebSocket Layer** (`src/ws/`) — EXPERIMENTAL
- `types.ts` - Bar, Quote, Timeframe, and configuration types
- `errors.ts` - TvWsError, ConnectionError, AuthError, SymbolError, TimeoutError
- `protocol.ts` - Packet encode/decode, session ID generation, message creation helpers
- `auth.ts` - Auth token handling and experimental feature gating
- `client.ts` - TvWsClient WebSocket connection with session dispatch
- `session.ts` - ChartSession and QuoteSession for bar data and quote streaming
- `parser.ts` - Bar and quote data parsing from raw WebSocket messages
- `index.ts` - Barrel export for the ws module

**Tools** (`src/tools/`)
- `screen.ts` - Stock/forex/crypto/ETF screening and symbol lookup. Contains `OPERATOR_MAP` for filter operators and `DEFAULT_COLUMNS`/`EXTENDED_COLUMNS` for response fields
- `search.ts` - Symbol search tool wrapper (MCP + CLI)
- `metainfo.ts` - Market metainfo tool wrapper
- `ta.ts` - Technical analysis summary (`get_ta_summary`) and ranking (`rank_by_ta`) tool wrappers
- `bars.ts` - Experimental `experimental_get_bars` tool (WebSocket, gated by TV_EXPERIMENTAL_ENABLED)
- `stream.ts` - Experimental `experimental_stream_quotes` and `experimental_stream_bars` tools (WebSocket, gated)
- `fields.ts` - Field metadata and listing (~100 fields across fundamental/technical/performance categories, for stock/etf/crypto/forex asset types)

**Resources** (`src/resources/`)
- `presets.ts` - Pre-configured screening strategies (quality_stocks, value_stocks, dividend_stocks, momentum_stocks, growth_stocks, quality_growth_screener, quality_compounder, garp, deep_value, breakout_scanner, earnings_momentum, dividend_growth, macro_assets, market_indexes). Presets can be filter-based or symbol-based (for direct lookup)

**Utilities** (`src/utils/`)
- `cache.ts` - In-memory cache with TTL
- `rateLimit.ts` - Token bucket rate limiter

### MCP Tools Exposed
1. `screen_stocks` - Screen stocks with filters
2. `screen_forex` - Screen forex pairs
3. `screen_crypto` - Screen cryptocurrencies
4. `screen_etf` - Screen ETFs
5. `lookup_symbols` - Direct symbol lookup (for indexes like TVC:SPX)
6. `list_fields` - List available screening fields (`asset_type`: stock, forex, crypto, etf)
7. `get_preset` / `list_presets` - Access pre-configured strategies
8. `search_symbols` - Search for TradingView symbols by name/ticker/description
9. `get_market_metainfo` - Get metadata about a market screener and available fields
10. `get_ta_summary` - TradingView-style technical analysis summary with buy/sell/neutral labels
11. `rank_by_ta` - Rank symbols by weighted TA scores across timeframes
12. `experimental_get_bars` - [EXPERIMENTAL] Fetch historical OHLCV bars via WebSocket (requires `TV_EXPERIMENTAL_ENABLED=1`)
13. `experimental_stream_quotes` - [EXPERIMENTAL] Stream real-time quotes (bounded duration) via WebSocket (requires `TV_EXPERIMENTAL_ENABLED=1`)
14. `experimental_stream_bars` - [EXPERIMENTAL] Stream bar updates (bounded duration) via WebSocket (requires `TV_EXPERIMENTAL_ENABLED=1`)

### Filter Operators
`OPERATOR_MAP` in `src/tools/screen.ts` maps 18 MCP operators to TradingView API operations:
- Numeric comparisons: `greater`, `less`, `greater_or_equal`, `less_or_equal`, `equal`, `not_equal`
- Range: `in_range`, `not_in_range`
- Cross-field: `crosses`, `crosses_above`, `crosses_below`
- String: `match`
- New (v2): `above_percent`, `below_percent`, `has`, `has_none_of`, `empty`, `not_empty`

The `empty` and `not_empty` operators require no `value` property.

### Data Flow
1. Tool call received → validate input → check cache
2. Convert MCP operators to TradingView operators via `OPERATOR_MAP`
3. Rate limit → API request → format response → cache result

## Configuration

Environment variables (set in `.mcp.json`):
- `CACHE_TTL_SECONDS` - Cache duration (default: 300)
- `RATE_LIMIT_RPM` - Requests per minute (default: 10)

Experimental (WebSocket features):
- `TV_EXPERIMENTAL_ENABLED` - Enable experimental tools (default: false, set to `1` or `true` to enable)
- `TV_SESSION_ID` - TradingView session ID for authenticated access
- `TV_SESSION_SIGN` - TradingView session signature
- `TV_WS_TIMEOUT_MS` - WebSocket timeout in milliseconds (default: 10000)
- `TV_WS_ENDPOINT` - WebSocket server: `data`, `prodata`, or `widgetdata` (default: `data`)

## Testing

Tests use Node's built-in test runner with tsx. Test files are in `src/tests/` with `.test.ts` suffix.

## Adding New Features

### New Field
1. Add to `STOCK_FIELDS` in `src/tools/fields.ts` with name, label, category, type, description
2. Optionally add to `EXTENDED_COLUMNS` in `src/tools/screen.ts`

### New Preset
Add to `PRESETS` in `src/resources/presets.ts` with filters array, markets, sort config, and optional custom columns.

### New Tool
1. Create implementation in `src/tools/`
2. Register in `ListToolsRequestSchema` handler in `src/index.ts`
3. Add case in `CallToolRequestSchema` handler

### When to use each tool:
- `search_symbols` — discover exact symbol identifiers before screening
- `lookup_symbols` — get current data for known tickers (including indexes)
- `screen_stocks/forex/crypto/etf` — find securities matching criteria
- `get_ta_summary` — get technical consensus (buy/sell/neutral) for specific symbols
- `rank_by_ta` — compare and rank symbols by multi-timeframe TA alignment
- `get_market_metainfo` — discover available fields for a market
- `list_fields` — browse field metadata by category

## Claude Code Commands

Project includes ready-to-use commands in `.claude/commands/`:
- `/market-regime` - Analyze global market indexes relative to ATH
- `/run-screener` - Interactive stock screening with preset strategies
- `/smart-screen` - Auto-select best strategy based on current market regime and run it
- `/macro-dashboard` - Multi-asset macro snapshot (US/global indexes, VIX, DXY, yields, gold, oil, crypto)
- `/sector-rotation` - Cross-sector performance ranking across all 11 GICS sectors
- `/due-diligence <SYMBOL>` - Structured due diligence report for a single stock
- `/compare-peers <SYM1> <SYM2> ...` - Side-by-side comparison of 2–5 stocks
- `/portfolio-risk <SYM1> <SYM2> ...` - Portfolio concentration and risk analysis
- `/investment-thesis <SYMBOL>` - Data-driven investment thesis with bull/bear case

See `.claude/commands/README.md` for full usage details and examples.
