# Spec: Core Path for TradingView Browserless Expansion

**Date:** 2026-04-10  
**Status:** Implementation-ready spec  
**Branch:** `feat/core-path`

---

## 1. Purpose

This document defines the **core path** for `tradingview-mcp-server`.

The core path is the stable, browserless expansion track that stays close to the repo's existing HTTP-first architecture.

It focuses on features that are:
- useful for everyday market workflows
- easy to validate
- low-risk compared with websocket/session research
- composable with both MCP and CLI usage

---

## 2. Product Direction

The repo is already strong at TradingView screener access. The core path expands that into a broader market intelligence layer.

### Core path goals
- make symbol discovery first-class
- expose market metainfo for validation and discovery
- add TradingView-style technical analysis summaries
- support multi-timeframe ranking
- keep implementation browserless and stable

### Core path principles
1. Prefer HTTP endpoints over browser automation.
2. Normalize upstream responses into repo-owned shapes.
3. Keep MCP tools and CLI commands aligned.
4. Preserve backward compatibility where possible.
5. Expose advanced TradingView fields in a way that remains understandable.

---

## 3. In Scope

### Core-1: `search_symbols`
Browserless symbol discovery using TradingView symbol search.

### Core-2: `get_market_metainfo`
Expose market/screener metadata to help clients understand available fields and structure.

### Core-3: richer field/timeframe support
Allow advanced TradingView field names and timeframe-qualified fields to flow through cleanly.

### Core-4: `get_ta_summary`
Return TradingView-style technical recommendation summaries across one or more timeframes.

### Core-5: `rank_by_ta`
Rank symbols by weighted TA alignment.

---

## 4. Out of Scope

The core path explicitly does **not** include:
- websocket quote streaming
- historical bar session harnesses
- TradingView Desktop / CDP integration
- Playwright/browser automation
- order execution
- Pine authoring / compilation
- screenshots or visual chart rendering

Those belong to the lab or future product lines.

---

## 5. Architecture Direction

### Suggested layout

```text
src/
  api/
    client.ts
    search.ts
    metainfo.ts
    ta.ts
    types.ts
  tools/
    screen.ts
    search.ts
    metainfo.ts
    ta.ts
  cli/
    parseArgs.ts
    help.ts
    formatters.ts
  tests/
    search.test.ts
    metainfo.test.ts
    ta.test.ts
```

### Design rules
- keep pure API access separate from tool wrappers
- reuse cache and rate limiting
- keep validation strict at tool boundaries
- normalize error messages
- batch requests where reasonable

---

## 6. Feature Specs

## 6.1 Core-1 — `search_symbols`

### User value
Lets users discover exact TradingView symbols from broad or narrow queries.

### Input
```json
{
  "query": "apple",
  "exchange": "NASDAQ",
  "asset_type": "stock",
  "limit": 20,
  "start": 0
}
```

### Output
```json
{
  "query": "apple",
  "count": 3,
  "symbols": [
    {
      "symbol": "NASDAQ:AAPL",
      "ticker": "AAPL",
      "description": "Apple Inc",
      "exchange": "NASDAQ",
      "type": "stock",
      "currency": "USD"
    }
  ]
}
```

### Acceptance criteria
- can search broad queries like `tesla`
- can narrow by exchange and type
- returns normalized symbols and descriptions
- handles empty and failed results cleanly

### Verification
- request builder tests
- response normalization tests
- CLI parsing tests
- MCP tool smoke shape test

---

## 6.2 Core-2 — `get_market_metainfo`

### User value
Helps clients discover what a market exposes and what fields are available.

### Input
```json
{
  "market": "america",
  "fields": ["name", "close", "market_cap_basic"],
  "mode": "summary"
}
```

### Output
```json
{
  "market": "america",
  "requested_fields": ["name", "close"],
  "metainfo": {
    "available": true,
    "field_count": 2,
    "fields": [
      { "name": "name", "label": "Name", "type": "string" },
      { "name": "close", "label": "Close", "type": "number" }
    ]
  }
}
```

### Acceptance criteria
- works for at least the `america` market
- invalid markets return explicit errors
- summary mode is compact and understandable
- raw mode remains available for debugging

### Verification
- request builder tests
- normalization tests
- raw passthrough tests

---

## 6.3 Core-3 — richer field/timeframe support

### User value
Makes the repo more TradingView-native without forcing a full allowlist of every possible field.

### Scope
- allow advanced column names to pass through
- keep curated lists for discoverability
- support timeframe-qualified fields like:
  - `close|60`
  - `Recommend.All|60`
  - `MACD.macd|1`

### Acceptance criteria
- advanced columns are preserved verbatim
- docs explain curated vs raw/advanced usage
- field handling remains predictable in CLI and MCP

---

## 6.4 Core-4 — `get_ta_summary`

### User value
Returns TradingView-style technical recommendation summaries for symbols and timeframes.

### Input
```json
{
  "symbols": ["NASDAQ:AAPL", "NASDAQ:NVDA"],
  "timeframes": ["60", "240", "1D", "1W"],
  "include_components": true
}
```

### Output
```json
{
  "symbols": [
    {
      "symbol": "NASDAQ:AAPL",
      "timeframes": {
        "1D": {
          "summary": "strong_buy",
          "scores": {
            "all": 0.88,
            "oscillators": 0.55,
            "moving_averages": 0.96
          }
        }
      }
    }
  ]
}
```

### Acceptance criteria
- supports one or more symbols
- supports multiple timeframes
- returns labels plus raw scores
- missing timeframe data degrades gracefully

### Verification
- timeframe builder tests
- score mapping tests
- response normalization tests
- mocked integration tests

---

## 6.5 Core-5 — `rank_by_ta`

### User value
Ranks a watchlist by technical alignment instead of dumping raw values.

### Input
```json
{
  "symbols": ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:NVDA"],
  "timeframes": ["60", "240", "1D"],
  "weights": {"60": 1, "240": 2, "1D": 3}
}
```

### Output
```json
{
  "ranked": [
    {
      "symbol": "NASDAQ:NVDA",
      "score": 0.81,
      "label": "strong_buy",
      "breakdown": {
        "60": 0.71,
        "240": 0.82,
        "1D": 0.89
      }
    }
  ]
}
```

### Acceptance criteria
- deterministic ranking
- readable breakdown per timeframe
- weighted average logic is stable
- thin wrapper on top of TA summary logic

---

## 7. Implementation Notes

- create or keep `src/api/search.ts`
- create or keep `src/api/metainfo.ts`
- create or keep `src/api/ta.ts`
- wire corresponding MCP tools in `src/index.ts`
- add CLI commands and help text in `src/cli/*`
- add tests for request builders, normalization, and formatting
- keep cache and rate limiter shared across new HTTP calls

---

## 8. Documentation Updates

When this path is implemented, update:
- `README.md`
- `docs/API_REFERENCE.md`
- `docs/COMMANDS.md`
- `docs/development.md`
- `CLAUDE.md`

Recommended additions:
- stable feature matrix
- search and TA examples
- explanation of advanced fields and timeframe-qualified columns
- CLI examples for `search`, `metainfo`, `ta`, and `rank-ta`

---

## 9. Verification Checklist

- [ ] `search_symbols` works for broad and narrow queries
- [ ] `get_market_metainfo` returns useful normalized data
- [ ] advanced columns and timeframe-qualified fields pass through correctly
- [ ] `get_ta_summary` returns label + raw scores
- [ ] `rank_by_ta` produces deterministic ordering
- [ ] CLI and MCP examples match the implementation
- [ ] tests cover happy path and error path behavior

---

## 10. Rollout Recommendation

1. Keep the current core branch implementation.
2. Add or update this spec doc in the branch.
3. Use the spec as the source of truth for follow-up cleanup and docs work.
4. If a later pass finds unused experiments or stale partial edits, clean those separately rather than reverting the core feature set.

---

## 11. Bottom Line

The core branch is already the right shape. This spec exists to make the branch's intent explicit and give future work a clear checklist.
