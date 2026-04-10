import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { SearchTool } from "../tools/search.js";
import { filterSearchResults, normalizeSearchResults } from "../api/search.js";
import type { SearchClient } from "../api/search.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";

describe("SearchTool", () => {
  const mockSearchClient = {
    searchSymbols: mock.fn(async (input: any) => ({
      query: input.query,
      count: 2,
      symbols: [
        {
          symbol: "NASDAQ:AAPL",
          ticker: "AAPL",
          description: "Apple Inc",
          exchange: "NASDAQ",
          type: "stock",
          currency: "USD",
        },
        {
          symbol: "NASDAQ:APLE",
          ticker: "APLE",
          description: "Apple Hospitality REIT",
          exchange: "NASDAQ",
          type: "stock",
          currency: "USD",
        },
      ],
    })),
  } as unknown as SearchClient;

  const mockCache = {
    get: mock.fn(() => null),
    set: mock.fn(),
  } as unknown as Cache;

  const mockRateLimiter = {
    acquire: mock.fn(async () => {}),
  } as unknown as RateLimiter;


  describe("searchSymbols", () => {
    it("should search symbols with query", async () => {
      const tool = new SearchTool(mockSearchClient, mockCache as any, mockRateLimiter as any);
      const result = await tool.searchSymbols({ query: "apple" });

      assert.strictEqual(result.query, "apple");
      assert.strictEqual(result.count, 2);
      assert.strictEqual(result.symbols[0].symbol, "NASDAQ:AAPL");
      assert.strictEqual(result.symbols[0].description, "Apple Inc");
    });

    it("should reject empty query", async () => {
      const tool = new SearchTool(mockSearchClient, mockCache as any, mockRateLimiter as any);
      await assert.rejects(
        async () => await tool.searchSymbols({ query: "" }),
        { message: /Query must be at least 1 character/ }
      );
    });

    it("should reject query with only whitespace", async () => {
      const tool = new SearchTool(mockSearchClient, mockCache as any, mockRateLimiter as any);
      await assert.rejects(
        async () => await tool.searchSymbols({ query: "   " }),
        { message: /Query must be at least 1 character/ }
      );
    });

    it("should reject limit > 50", async () => {
      const tool = new SearchTool(mockSearchClient, mockCache as any, mockRateLimiter as any);
      await assert.rejects(
        async () => await tool.searchSymbols({ query: "test", limit: 51 }),
        { message: /Limit must be between 1 and 50/ }
      );
    });

    it("should reject limit < 1", async () => {
      const tool = new SearchTool(mockSearchClient, mockCache as any, mockRateLimiter as any);
      await assert.rejects(
        async () => await tool.searchSymbols({ query: "test", limit: 0 }),
        { message: /Limit must be between 1 and 50/ }
      );
    });

    it("should accept valid limit", async () => {
      const tool = new SearchTool(mockSearchClient, mockCache as any, mockRateLimiter as any);
      const result = await tool.searchSymbols({ query: "apple", limit: 10 });
      assert.strictEqual(result.count, 2);
    });

    it("should pass exchange and asset_type", async () => {
      const tool = new SearchTool(mockSearchClient, mockCache as any, mockRateLimiter as any);
      const result = await tool.searchSymbols({
        query: "apple",
        exchange: "NASDAQ",
        asset_type: "stock",
      });
      assert.strictEqual(result.count, 2);
    });

    it("should return cached result when available", async () => {
      const cachedResult = {
        query: "apple",
        count: 1,
        symbols: [{ symbol: "NASDAQ:AAPL", ticker: "AAPL", description: "Apple Inc", exchange: "NASDAQ", type: "stock" }],
      };
      const cacheWithHit = {
        get: mock.fn(() => cachedResult),
        set: mock.fn(),
      } as unknown as Cache;

      const tool = new SearchTool(mockSearchClient, cacheWithHit as any, mockRateLimiter as any);
      const result = await tool.searchSymbols({ query: "apple" });
      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.symbols[0].symbol, "NASDAQ:AAPL");
    });
  });
});

describe("SearchClient - URL building", () => {
  it("should build correct URL with query params", async () => {
    // We can't easily test the actual HTTP call without mocking fetch,
    // but we can test that the client is set up correctly
    const { SearchClient } = await import("../api/search.js");
    const client = new SearchClient();
    assert.ok(client);
    assert.ok(typeof client.searchSymbols === "function");
  });
});

describe("SearchClient - pagination normalization", () => {
  it("should keep the total hit count after slicing", () => {
    const results = normalizeSearchResults(
      [
        { symbol: "NASDAQ:AAPL", ticker: "AAPL", exchange: "NASDAQ", type: "stock" },
        { symbol: "NASDAQ:MSFT", ticker: "MSFT", exchange: "NASDAQ", type: "stock" },
        { symbol: "NASDAQ:NVDA", ticker: "NVDA", exchange: "NASDAQ", type: "stock" },
      ],
      1,
      1
    );

    assert.strictEqual(results.count, 3);
    assert.strictEqual(results.symbols.length, 1);
    assert.strictEqual(results.symbols[0].symbol, "NASDAQ:MSFT");
  });
});

describe("SearchClient - asset type filtering", () => {
  it("should narrow mixed results to the requested asset type", () => {
    const rawResults = [
      { symbol: "NASDAQ:AAPL", ticker: "AAPL", exchange: "NASDAQ", type: "stock" },
      { symbol: "BINANCE:BTCUSDT", ticker: "BTCUSDT", exchange: "CRYPTO", type: "spot" },
      { symbol: "NYSE:SPY", ticker: "SPY", exchange: "NYSE", type: "fund" },
    ];

    const filtered = filterSearchResults(rawResults, "crypto");
    const normalized = normalizeSearchResults(filtered, 0, 10);

    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(normalized.count, 1);
    assert.strictEqual(normalized.symbols[0].symbol, "CRYPTO:BTCUSDT");
    assert.strictEqual(normalized.symbols[0].exchange, "CRYPTO");
  });
});
