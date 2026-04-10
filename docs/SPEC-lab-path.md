# Spec: Lab Path for TradingView Browserless Expansion

**Date:** 2026-04-10  
**Status:** Implementation-ready spec  
**Branch:** `feat/lab-path`

---

## 1. Purpose

This document defines the **lab path** for `tradingview-mcp-server`.

The lab path is the experimental browserless track for higher-upside TradingView research features that rely on undocumented websocket/session behavior.

It exists to:
- separate fragile experimental code from stable core features
- keep user expectations clear
- make testing and rollback easier
- let future work evolve without contaminating the stable path

---

## 2. Product Direction

The lab path pushes beyond screener/search/metainfo into TradingView session-style data access.

### Lab path goals
- fetch historical OHLCV bars
- stream short-lived quote updates
- stream bar updates in a bounded way
- encapsulate websocket/session handling behind a dedicated adapter layer
- mark all experimental features clearly

### Lab path principles
1. Never blur experimental features with stable ones.
2. Gate access explicitly.
3. Keep streams bounded and safe for MCP usage.
4. Prefer normalized output shapes over raw protocol payloads.
5. Make parser/session logic testable without a live TradingView connection.

---

## 3. In Scope

### Lab-1: `experimental_get_bars`
Historical OHLCV bars from TradingView websocket/session machinery.

### Lab-2: `experimental_stream_quotes`
Bounded quote collection from websocket/session machinery.

### Lab-3: `experimental_stream_bars`
Bounded bar-update collection with rolling or close-only modes.

### Lab-4: websocket/session adapter layer
Internal module boundaries for protocol, auth, parsing, and session orchestration.

---

## 4. Out of Scope

The lab path does **not** include:
- browser automation
- TradingView Desktop / CDP integration
- order placement
- Pine authoring / compilation
- visual chart rendering
- a hosted UI

Those are separate product directions.

---

## 5. Architecture Direction

### Suggested layout

```text
src/
  ws/
    client.ts
    protocol.ts
    session.ts
    parser.ts
    auth.ts
    types.ts
    errors.ts
  tools/
    bars.ts
    stream.ts
  tests/
    ws-protocol.test.ts
    ws-parser.test.ts
    bars.test.ts
    stream.test.ts
```

### Design rules
- isolate websocket protocol details from tools
- keep experimental logic behind explicit tool names
- support environment/session gating
- return bounded collections rather than infinite streams in MCP
- keep CLI streaming ergonomics explicit and opt-in

---

## 6. Feature Specs

## 6.1 Lab-1 — `experimental_get_bars`

### User value
Fetch OHLCV bars directly from browserless TradingView websocket/session machinery.

### Input
```json
{
  "symbol": "BINANCE:BTCUSDT",
  "timeframe": "60",
  "limit": 500,
  "extended_session": false
}
```

### Output
```json
{
  "symbol": "BINANCE:BTCUSDT",
  "timeframe": "60",
  "count": 500,
  "bars": [
    {
      "time": 1712700000,
      "open": 68123.4,
      "high": 68410.2,
      "low": 67992.1,
      "close": 68355.7,
      "volume": 1234.56
    }
  ],
  "source": "experimental_tradingview_ws"
}
```

### Acceptance criteria
- works without browser automation
- returns ascending bars
- fails clearly on auth or symbol errors
- bounded output by default

### Verification
- websocket packet formatting/parsing tests
- parser tests for payload to bars conversion
- mocked session transcript tests
- optional live smoke tests behind env flags

---

## 6.2 Lab-2 — `experimental_stream_quotes`

### User value
Collect short-lived quote updates for one or more symbols.

### Input
```json
{
  "symbols": ["NASDAQ:AAPL", "BINANCE:BTCUSDT"],
  "fields": ["lp", "bid", "ask", "volume"],
  "duration_seconds": 10
}
```

### Output
```json
{
  "duration_seconds": 10,
  "updates": [
    {
      "symbol": "NASDAQ:AAPL",
      "time": 1712700001,
      "price": 183.42,
      "bid": 183.40,
      "ask": 183.44
    }
  ]
}
```

### Acceptance criteria
- bounded duration by default
- returns cleanly even with zero updates
- can collect multiple updates when available
- avoids indefinite streams for MCP calls

---

## 6.3 Lab-3 — `experimental_stream_bars`

### User value
Capture bounded bar updates, either rolling or close-only.

### Input
```json
{
  "symbol": "BINANCE:BTCUSDT",
  "timeframe": "1",
  "duration_seconds": 30,
  "mode": "rolling"
}
```

### Output
```json
{
  "symbol": "BINANCE:BTCUSDT",
  "timeframe": "1",
  "mode": "rolling",
  "events": [
    {
      "kind": "update",
      "bar": {
        "time": 1712700060,
        "open": 68200,
        "high": 68250,
        "low": 68190,
        "close": 68240,
        "volume": 45.2
      }
    }
  ]
}
```

### Acceptance criteria
- bounded event collection
- supports rolling and close-only behavior
- no infinite hang
- dedupes or coalesces updates sensibly

---

## 7. Experimental Boundary

Recommended naming:
- `experimental_get_bars`
- `experimental_stream_quotes`
- `experimental_stream_bars`

Recommended gating:
- environment flag for enabling lab features
- explicit CLI namespace like `experimental`
- clearly labeled docs and help text

---

## 8. Implementation Notes

- build a dedicated websocket/session adapter layer
- keep parser and protocol logic independently testable
- make live behavior opt-in only
- prefer normalized results over raw protocol dumps
- reuse whatever common client utilities are safe to share

---

## 9. Documentation Updates

When this path is implemented, update:
- `README.md`
- `docs/API_REFERENCE.md`
- `docs/COMMANDS.md`
- `docs/development.md`
- `CLAUDE.md`

Include:
- experimental caveats
- env/session setup notes
- CLI examples under an explicit experimental namespace
- warnings about instability and undocumented behavior

---

## 10. Verification Checklist

- [ ] `experimental_get_bars` returns normalized bars
- [ ] `experimental_stream_quotes` returns bounded quote collections
- [ ] `experimental_stream_bars` returns bounded event collections
- [ ] websocket protocol helpers are unit-tested
- [ ] parser/session modules are testable without live TradingView access
- [ ] experimental flags and CLI namespace clearly separate lab features from core features
- [ ] docs explain the risk and expected behavior clearly

---

## 11. Bottom Line

The lab branch is the right place for experimental websocket/session work. This spec makes that boundary explicit and gives future work a checklist to validate against.
