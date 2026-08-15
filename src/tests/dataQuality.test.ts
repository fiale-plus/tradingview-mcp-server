import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import { MetainfoTool } from "../tools/metainfo.js";
import { SearchTool } from "../tools/search.js";
import { ScreenTool } from "../tools/screen.js";
import { TAClient } from "../api/ta.js";
import type { MetainfoClient } from "../api/metainfo.js";
import type { SearchClient } from "../api/search.js";
import type { TradingViewClient } from "../api/client.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";

function makeCache() {
  let value: unknown = null;
  return {
    cache: {
      get: mock.fn(() => value),
      set: mock.fn((_key: string, next: unknown) => {
        value = next;
      }),
    } as unknown as Cache,
    read: () => value,
  };
}

function makeRateLimiter(): RateLimiter {
  return { acquire: mock.fn(async () => {}) } as unknown as RateLimiter;
}

function assertIsoTimestamp(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new TypeError("expected ISO timestamp");
  }
  assert.match(value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
}

describe("result provenance and completeness metadata", () => {
  it("reports missing lookup symbols and cache hits", async () => {
    const cache = makeCache();
    const scanStocks = mock.fn(async () => ({
      totalCount: 1,
      data: [{
        s: "NASDAQ:AAPL",
        d: ["Apple", 180, 1, 1000, 2_000_000_000_000, 200, 120, 190, 130],
      }],
    }));
    const client = { scanStocks } as unknown as TradingViewClient;
    const tool = new ScreenTool(client, cache.cache, makeRateLimiter());

    const fresh = await tool.lookupSymbols({ symbols: ["NASDAQ:AAPL", "NASDAQ:MSFT"] });
    assert.deepEqual(fresh.metadata.missing_symbols, ["NASDAQ:MSFT"]);
    assert.equal(fresh.metadata.requested_count, 2);
    assert.equal(fresh.metadata.returned_count, 1);
    assert.equal(fresh.metadata.cache_hit, false);
    assert.equal(fresh.metadata.source, "https://scanner.tradingview.com/global/scan");
    assertIsoTimestamp(fresh.metadata.retrieved_at);

    const cached = await tool.lookupSymbols({ symbols: ["NASDAQ:AAPL", "NASDAQ:MSFT"] });
    assert.equal(cached.metadata.cache_hit, true);
    assert.deepEqual(cached.metadata.missing_symbols, ["NASDAQ:MSFT"]);
    assert.equal(scanStocks.mock.calls.length, 1);
  });

  it("adds counts and source metadata to screening, search, and metainfo results", async () => {
    const screenCache = makeCache();
    const screenClient = {
      scanStocks: mock.fn(async () => ({
        totalCount: 1,
        data: [{ s: "NASDAQ:AAPL", d: ["Apple", 180, 1, 2, 3, 4, 5] }],
      })),
    } as unknown as TradingViewClient;
    const screen = new ScreenTool(screenClient, screenCache.cache, makeRateLimiter());
    const screened = await screen.screenStocks({ filters: [], limit: 5 });
    assert.equal(screened.metadata.requested_count, 5);
    assert.equal(screened.metadata.returned_count, 1);
    assert.equal(screened.metadata.source, "https://scanner.tradingview.com/global/scan");

    const searchCache = makeCache();
    const searchClient = {
      searchSymbols: mock.fn(async () => ({
        query: "apple",
        count: 2,
        symbols: [{ symbol: "NASDAQ:AAPL" }, { symbol: "NASDAQ:APLE" }],
      })),
    } as unknown as SearchClient;
    const search = new SearchTool(searchClient, searchCache.cache, makeRateLimiter());
    const searched = await search.searchSymbols({ query: "apple", limit: 10 });
    assert.equal(searched.metadata.requested_count, 10);
    assert.equal(searched.metadata.returned_count, 2);
    assert.equal(searched.metadata.source, "https://symbol-search.tradingview.com/symbol_search/v3");

    const metainfoCache = makeCache();
    const metainfoClient = {
      getMetainfo: mock.fn(async () => ({
        market: "america",
        requested_fields: ["close"],
        metainfo: {
          available: true,
          field_count: 1,
          fields: [{ name: "close" }],
        },
      })),
    } as unknown as MetainfoClient;
    const metainfo = new MetainfoTool(metainfoClient, metainfoCache.cache, makeRateLimiter());
    const info = await metainfo.getMetainfo({ market: "america", fields: ["close"] });
    assert.equal(info.metadata.requested_count, 1);
    assert.equal(info.metadata.returned_count, 1);
    assert.equal(info.metadata.source, "https://scanner.tradingview.com/america/metainfo");
  });
});

describe("TA missing-data semantics", () => {
  function makeTAClient(response: unknown, cache = makeCache()) {
    const client = {
      scanStocks: mock.fn(async () => response),
    } as unknown as TradingViewClient;
    return new TAClient(client, cache.cache, makeRateLimiter());
  }

  it("distinguishes unavailable TA values from a genuine neutral score", async () => {
    const taClient = makeTAClient({
      totalCount: 2,
      data: [
        { s: "NASDAQ:AAPL", d: ["Apple", null, null, null] },
        { s: "NASDAQ:MSFT", d: ["Microsoft", 0, 0, 0] },
      ],
    });
    const result = await taClient.getTASummary({
      symbols: ["NASDAQ:AAPL", "NASDAQ:MSFT"],
      timeframes: ["60"],
    });

    const unavailable = result.symbols.find((item) => item.symbol === "NASDAQ:AAPL");
    const neutral = result.symbols.find((item) => item.symbol === "NASDAQ:MSFT");
    assert.ok(unavailable);
    assert.ok(neutral);
    assert.equal(unavailable.timeframes["60"].summary, "unavailable");
    assert.equal(unavailable.timeframes["60"].available, false);
    assert.equal(unavailable.timeframes["60"].scores.all, null);
    assert.equal(neutral.timeframes["60"].summary, "neutral");
    assert.equal(neutral.timeframes["60"].available, true);
    assert.equal(neutral.timeframes["60"].scores.all, 0);
    assert.deepEqual(result.metadata.unavailable_symbols, ["NASDAQ:AAPL"]);
  });

  it("excludes unavailable and missing symbols from ranking with reasons", async () => {
    const taClient = makeTAClient({
      totalCount: 1,
      data: [{ s: "NASDAQ:MSFT", d: ["Microsoft", 0.4, 0.1, 0.5] }],
    });
    const result = await taClient.rankByTA({
      symbols: ["NASDAQ:AAPL", "NASDAQ:MSFT"],
      timeframes: ["60"],
    });
    const cached = await taClient.rankByTA({
      symbols: ["NASDAQ:AAPL", "NASDAQ:MSFT"],
      timeframes: ["60"],
    });
    assert.equal(cached.metadata.cache_hit, true);

    assert.deepEqual(result.ranked.map((item) => item.symbol), ["NASDAQ:MSFT"]);
    assert.deepEqual(result.excluded_symbols, [
      { symbol: "NASDAQ:AAPL", reason: "missing_symbol" },
    ]);
    assert.deepEqual(result.metadata.missing_symbols, ["NASDAQ:AAPL"]);
  });

  it("rejects invalid effective TA weights", async () => {
    const taClient = makeTAClient({ totalCount: 0, data: [] });
    await assert.rejects(
      () => taClient.rankByTA({ symbols: ["NASDAQ:AAPL"], timeframes: ["60"], weights: { "60": 0 } }),
      /weights must assign a positive total weight/
    );
    await assert.rejects(
      () => taClient.rankByTA({ symbols: ["NASDAQ:AAPL"], timeframes: ["60"], weights: { "1D": 1 } }),
      /weights contains timeframe '1D' that is not being ranked/
    );
  });
});
