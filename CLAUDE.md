# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TradingView MCP Server is an unofficial Model Context Protocol server that provides access to TradingView's market screener API. It enables AI-powered stock, forex, crypto, and ETF screening through Claude Desktop or Claude Code.

## Build and Development Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run dev          # Run directly with tsx (no build step)
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

### Entry Point and MCP Server Setup
`src/index.ts` - Creates the MCP server, registers tools and resources, handles tool calls. Initializes core components:
- `TradingViewClient` - API client
- `Cache` - Response caching (configurable TTL)
- `RateLimiter` - Request throttling (configurable RPM)
- `ScreenTool`, `FieldsTool`, `PresetsTool` - Tool implementations

### Core Components

**API Layer** (`src/api/`)
- `client.ts` - HTTP client for TradingView scanner API endpoints (`/global/scan`, `/forex/scan`, `/crypto/scan`)
- `types.ts` - TypeScript interfaces for API requests/responses

**Tools** (`src/tools/`)
- `screen.ts` - Stock/forex/crypto/ETF screening and symbol lookup. Contains `OPERATOR_MAP` for filter operators and `DEFAULT_COLUMNS`/`EXTENDED_COLUMNS` for response fields
- `fields.ts` - Field metadata and listing (75+ fields across fundamental/technical/performance categories)

**Resources** (`src/resources/`)
- `presets.ts` - Pre-configured screening strategies (quality_stocks, value_stocks, dividend_stocks, momentum_stocks, growth_stocks, quality_growth_screener, market_indexes). Presets can be filter-based or symbol-based (for direct lookup)

**Utilities** (`src/utils/`)
- `cache.ts` - In-memory cache with TTL
- `rateLimit.ts` - Token bucket rate limiter

### MCP Tools Exposed
1. `screen_stocks` - Screen stocks with filters
2. `screen_forex` - Screen forex pairs
3. `screen_crypto` - Screen cryptocurrencies
4. `screen_etf` - Screen ETFs
5. `lookup_symbols` - Direct symbol lookup (for indexes like TVC:SPX)
6. `list_fields` - List available screening fields
7. `get_preset` / `list_presets` - Access pre-configured strategies

### Data Flow
1. Tool call received → validate input → check cache
2. Convert MCP operators to TradingView operators via `OPERATOR_MAP`
3. Rate limit → API request → format response → cache result

## Configuration

Environment variables (set in `.mcp.json`):
- `CACHE_TTL_SECONDS` - Cache duration (default: 300)
- `RATE_LIMIT_RPM` - Requests per minute (default: 10)

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

## Claude Code Commands

Project includes ready-to-use commands in `.claude/commands/`:
- `/market-regime` - Analyze global market indexes relative to ATH
- `/run-screener` - Interactive stock screening with preset strategies
