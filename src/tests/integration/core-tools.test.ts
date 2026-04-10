/**
 * Integration tests — hit real TradingView API endpoints.
 *
 * Run manually:    npm run test:integration
 * Run in CI:       .github/workflows/integration.yml (scheduled + manual dispatch)
 *
 * Gated behind TV_INTEGRATION=1 so `npm test` never touches the network.
 *
 * Design choices:
 *   - Import TS source directly via tsx (same pattern as unit tests)
 *   - Assertions check shape and validity, not exact values (market data changes)
 *   - Rate-limit pauses between test groups
 *   - 15s generous timeouts for CI network variability
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

// Guard: skip entire suite unless explicitly enabled
const INTEGRATION_ENABLED = process.env.TV_INTEGRATION === "1";
if (!INTEGRATION_ENABLED) {
  console.log("Skipping integration tests (set TV_INTEGRATION=1 to enable)");
  process.exit(0);
}

// Import source modules directly — tsx handles TS→JS
import { SearchClient, normalizeSearchResults } from "../../api/search.js";
import { MetainfoClient } from "../../api/metainfo.js";
import { TAClient, scoreToLabel } from "../../api/ta.js";
import { TradingViewClient } from "../../api/client.js";
import { Cache } from "../../utils/cache.js";
import { RateLimiter } from "../../utils/rateLimit.js";

// Pause between test groups to respect rate limits
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Shared infrastructure — fresh per group to avoid cache cross-contamination
function makeClients() {
  const cache = new Cache(60);
  const rateLimiter = new RateLimiter(10);
  const client = new TradingViewClient();
  const taClient = new TAClient(client, cache, rateLimiter);
  return { cache, rateLimiter, client, taClient };
}

// ──────────────────────────────────────────────────────────────
// Core-1: search_symbols
// ──────────────────────────────────────────────────────────────
describe("Integration — Core-1: search_symbols", () => {
  const searchClient = new SearchClient();

  it("should find Apple Inc when searching 'apple'", async () => {
    const result = await searchClient.searchSymbols({ query: "apple", limit: 5 });
    assert.ok(result.symbols.length > 0, "Expected at least 1 result");

    const aapl = result.symbols.find((s) => s.symbol === "NASDAQ:AAPL");
    assert.ok(aapl, "Expected to find NASDAQ:AAPL");
    assert.equal(aapl.type, "stock");
    assert.ok(aapl.description.includes("Apple"), `Description should mention Apple, got: ${aapl.description}`);

    // No HTML tags leaked through
    assert.ok(!aapl.description.includes("<em>"), "No <em> tags in description");
    assert.ok(!aapl.ticker.includes("<"), "No HTML tags in ticker");
  });

  it("should respect exchange filter", async () => {
    const result = await searchClient.searchSymbols({ query: "AAPL", exchange: "NASDAQ", limit: 5 });
    assert.ok(result.symbols.length > 0);
    for (const s of result.symbols) {
      assert.ok(
        s.exchange === "NASDAQ" || s.symbol.startsWith("NASDAQ:"),
        `Expected NASDAQ exchange, got: ${s.exchange} for ${s.symbol}`
      );
    }
  });

  it("should return crypto results for bitcoin query", async () => {
    // TradingView symbol-search doesn't support server-side type filtering.
    // We just query and verify the response contains crypto-type results.
    const result = await searchClient.searchSymbols({ query: "bitcoin", limit: 5 });
    assert.ok(result.symbols.length > 0, "Expected results for bitcoin");
    assert.ok(
      result.symbols.some((s) => s.type === "spot" || s.exchange === "CRYPTO"),
      "Expected at least one crypto result"
    );
  });

  it("should respect limit parameter", async () => {
    const result = await searchClient.searchSymbols({ query: "a", limit: 3 });
    assert.ok(result.symbols.length <= 3, `Expected at most 3 symbols, got ${result.symbols.length}`);
  });

  it("should return normalized response shape", async () => {
    const result = await searchClient.searchSymbols({ query: "tesla", limit: 2 });
    assert.equal(typeof result.query, "string");
    assert.equal(typeof result.count, "number");
    assert.ok(Array.isArray(result.symbols));
    if (result.symbols.length > 0) {
      const s = result.symbols[0];
      assert.ok(s.symbol, "symbol field");
      assert.ok(s.ticker, "ticker field");
      assert.ok(s.description, "description field");
      assert.ok(s.exchange, "exchange field");
      assert.ok(s.type, "type field");
    }
  });

  it("should handle queries with no results gracefully", async () => {
    const result = await searchClient.searchSymbols({ query: "zzzzzzzzzzznonexistent" });
    assert.ok(Array.isArray(result.symbols), "symbols should always be an array");
  });
});

// ──────────────────────────────────────────────────────────────
// Core-2: get_market_metainfo
// ──────────────────────────────────────────────────────────────
describe("Integration — Core-2: get_market_metainfo", () => {
  let metainfoClient: MetainfoClient;

  before(async () => {
    metainfoClient = new MetainfoClient();
    await sleep(2000); // rate-limit between groups
  });

  it("should return fields for the america market", async () => {
    const result = await metainfoClient.getMetainfo({ market: "america" });
    assert.equal(result.market, "america");
    assert.equal(result.metainfo.available, true);
    assert.ok(result.metainfo.field_count > 0, `Expected fields, got ${result.metainfo.field_count}`);
    assert.ok(result.metainfo.fields.length > 0);
    assert.ok(result.metainfo.fields[0].name, "First field should have a name");
  });

  it("should filter to requested fields", async () => {
    const result = await metainfoClient.getMetainfo({ market: "america", fields: ["close", "name"] });
    assert.equal(result.market, "america");
    assert.ok(result.requested_fields.includes("close"));
    assert.ok(result.requested_fields.includes("name"));
    const names = result.metainfo.fields.map((f: any) => f.name);
    assert.ok(
      names.some((n: string) => ["close", "name"].includes(n)),
      `Expected close or name in results, got: ${names.join(", ")}`
    );
  });

  it("should support raw mode", async () => {
    const result = await metainfoClient.getMetainfo({ market: "america", mode: "raw" });
    assert.equal(result.market, "america");
    assert.ok(result.raw, "Should have raw data");
    assert.equal(typeof result.raw, "object");
  });

  it("should reject invalid market", async () => {
    await assert.rejects(
      () => metainfoClient.getMetainfo({ market: "nonexistent_market_xyz" }),
      (err: any) => {
        assert.ok(
          err.message.includes("Invalid market") || err.message.includes("404"),
          `Expected market error, got: ${err.message}`
        );
        return true;
      }
    );
  });
});

// ──────────────────────────────────────────────────────────────
// Core-4: get_ta_summary
// ──────────────────────────────────────────────────────────────
describe("Integration — Core-4: get_ta_summary", () => {
  let taClient: TAClient;

  before(async () => {
    const { taClient: tc } = makeClients();
    taClient = tc;
    await sleep(2000);
  });

  const VALID_LABELS = ["strong_buy", "buy", "neutral", "sell", "strong_sell"];

  it("should return TA summary for a single symbol", async () => {
    const result = await taClient.getTASummary({
      symbols: ["NASDAQ:AAPL"],
      timeframes: ["60", "240"],
    });

    assert.ok(result.symbols);
    assert.equal(result.symbols.length, 1);
    const aapl = result.symbols[0];
    assert.equal(aapl.symbol, "NASDAQ:AAPL");
    assert.ok(aapl.timeframes["60"], "60m timeframe");
    assert.ok(aapl.timeframes["240"], "240m timeframe");

    const tf60 = aapl.timeframes["60"];
    assert.ok(VALID_LABELS.includes(tf60.summary), `Invalid label: ${tf60.summary}`);
    assert.equal(typeof tf60.scores.all, "number");
    assert.ok(tf60.scores.all >= -1 && tf60.scores.all <= 1, `Score out of range: ${tf60.scores.all}`);
  });

  it("should include oscillator and MA breakdown when include_components=true", async () => {
    const result = await taClient.getTASummary({
      symbols: ["NASDAQ:AAPL"],
      timeframes: ["60"],
      include_components: true,
    });

    const tf = result.symbols[0].timeframes["60"];
    assert.ok(tf.scores.oscillators !== undefined, "oscillators score");
    assert.ok(tf.scores.moving_averages !== undefined, "moving_averages score");
    assert.equal(typeof tf.scores.oscillators, "number");
    assert.equal(typeof tf.scores.moving_averages, "number");
  });

  it("should exclude component breakdown when include_components=false", async () => {
    const result = await taClient.getTASummary({
      symbols: ["NASDAQ:AAPL"],
      timeframes: ["60"],
      include_components: false,
    });

    const tf = result.symbols[0].timeframes["60"];
    assert.equal(tf.scores.oscillators, undefined, "oscillators should be absent");
    assert.equal(tf.scores.moving_averages, undefined, "MA should be absent");
    assert.equal(typeof tf.scores.all, "number", "all score should still be present");
  });

  it("should handle multiple symbols", async () => {
    const result = await taClient.getTASummary({
      symbols: ["NASDAQ:AAPL", "NASDAQ:NVDA"],
      timeframes: ["60"],
    });

    assert.equal(result.symbols.length, 2);
    const syms = result.symbols.map((s) => s.symbol);
    assert.ok(syms.includes("NASDAQ:AAPL"));
    assert.ok(syms.includes("NASDAQ:NVDA"));
  });

  it("should degrade gracefully for null/missing timeframe data", async () => {
    const result = await taClient.getTASummary({
      symbols: ["NASDAQ:AAPL"],
      timeframes: ["1D"], // may be null outside market hours
    });

    const tf = result.symbols[0].timeframes["1D"];
    assert.ok(tf.summary, "Should have summary even for null data");
    assert.ok(VALID_LABELS.includes(tf.summary), `Invalid label: ${tf.summary}`);
    assert.equal(typeof tf.scores.all, "number", "Should have numeric score");
  });
});

// ──────────────────────────────────────────────────────────────
// Core-5: rank_by_ta
// ──────────────────────────────────────────────────────────────
describe("Integration — Core-5: rank_by_ta", () => {
  let taClient: TAClient;

  before(async () => {
    const { taClient: tc } = makeClients();
    taClient = tc;
    await sleep(2000);
  });

  it("should rank symbols in descending order by score", async () => {
    const result = await taClient.rankByTA({
      symbols: ["NASDAQ:AAPL", "NASDAQ:NVDA", "NASDAQ:MSFT"],
      timeframes: ["60", "240"],
    });

    assert.ok(result.ranked);
    assert.equal(result.ranked.length, 3);
    // Verify strict descending order
    for (let i = 1; i < result.ranked.length; i++) {
      assert.ok(
        result.ranked[i - 1].score >= result.ranked[i].score,
        `Order broken: ${result.ranked[i - 1].symbol}(${result.ranked[i - 1].score}) < ${result.ranked[i].symbol}(${result.ranked[i].score})`
      );
    }
  });

  it("should include per-timeframe breakdown", async () => {
    const result = await taClient.rankByTA({
      symbols: ["NASDAQ:AAPL"],
      timeframes: ["60", "240"],
    });

    const item = result.ranked[0];
    assert.ok(item.breakdown);
    assert.equal(typeof item.breakdown["60"], "number");
    assert.equal(typeof item.breakdown["240"], "number");
    assert.equal(typeof item.score, "number");
    assert.ok(["strong_buy", "buy", "neutral", "sell", "strong_sell"].includes(item.label));
  });

  it("should apply custom weights", async () => {
    const result = await taClient.rankByTA({
      symbols: ["NASDAQ:AAPL", "NASDAQ:NVDA"],
      timeframes: ["60", "240"],
      weights: { "60": 1, "240": 3 },
    });

    assert.equal(result.weights["60"], 1);
    assert.equal(result.weights["240"], 3);
    assert.equal(result.requested_symbols, 2);
    assert.deepEqual(result.timeframes, ["60", "240"]);
  });

  it("should use equal weights by default", async () => {
    const result = await taClient.rankByTA({
      symbols: ["NASDAQ:AAPL"],
      timeframes: ["60", "240"],
    });

    assert.equal(result.weights["60"], 1);
    assert.equal(result.weights["240"], 1);
  });
});

// ──────────────────────────────────────────────────────────────
// Regression: existing tools still work
// ──────────────────────────────────────────────────────────────
describe("Integration — Existing tools regression", () => {
  let client: TradingViewClient;
  let cache: Cache;
  let rateLimiter: RateLimiter;

  before(async () => {
    const infra = makeClients();
    client = infra.client;
    cache = infra.cache;
    rateLimiter = infra.rateLimiter;
    await sleep(2000);
  });

  it("should still screen stocks", async () => {
    const { ScreenTool } = await import("../../tools/screen.js");
    const screenTool = new ScreenTool(client, cache, rateLimiter);

    // Use a reliable filter — market cap is always present for large caps
    const result = await screenTool.screenStocks({
      filters: [{ field: "market_cap_basic", operator: "greater", value: 3000000000000 }],
      markets: ["america"],
      sort_by: "market_cap_basic",
      sort_order: "desc",
      limit: 3,
    });

    assert.ok(result.stocks, "Should have stocks array");
    assert.ok(result.stocks.length > 0, "Should find mega-cap stocks");
  });

  it("should still lookup symbols", async () => {
    const { ScreenTool } = await import("../../tools/screen.js");
    const screenTool = new ScreenTool(client, cache, rateLimiter);

    const result = await screenTool.lookupSymbols({ symbols: ["NASDAQ:AAPL"] });
    assert.ok(result.symbols, "Should have symbols array");
    assert.equal(result.symbols.length, 1);
    assert.equal(result.symbols[0].symbol, "NASDAQ:AAPL");
  });
});
