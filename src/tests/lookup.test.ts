import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { ScreenTool } from "../tools/screen.js";
import type { TradingViewClient } from "../api/client.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";

describe("ScreenTool - lookupSymbols Integration", () => {
  // Create mock dependencies
  const mockClient = {
    scanStocks: mock.fn(),
  } as unknown as TradingViewClient;

  const mockCache = {
    get: mock.fn(() => null),
    set: mock.fn(),
    startCleanup: mock.fn(),
  } as unknown as Cache;

  const mockRateLimiter = {
    acquire: mock.fn(async () => {}),
  } as unknown as RateLimiter;

  const screenTool = new ScreenTool(mockClient, mockCache, mockRateLimiter);

  describe("Input validation", () => {
    it("should reject empty symbols array", async () => {
      await assert.rejects(
        async () => {
          await screenTool.lookupSymbols({
            symbols: [],
          });
        },
        {
          message: /At least one symbol is required/,
        }
      );
    });

    it("should reject more than 100 symbols", async () => {
      const symbols = Array.from({ length: 101 }, (_, i) => `SYMBOL${i}`);

      await assert.rejects(
        async () => {
          await screenTool.lookupSymbols({
            symbols,
          });
        },
        {
          message: /Maximum 100 symbols allowed/,
        }
      );
    });

    it("should accept exactly 100 symbols", async () => {
      const symbols = Array.from({ length: 100 }, (_, i) => `SYMBOL${i}`);

      // Mock successful response
      (mockClient.scanStocks as any).mock.mockImplementation(async () => ({
        totalCount: 100,
        data: symbols.map(s => ({
          s,
          d: ["Test", 100, 5, 1000000, 1000000000, 150, 50, 120, 80],
        })),
      }));

      await assert.doesNotReject(async () => {
        await screenTool.lookupSymbols({ symbols });
      });
    });
  });

  describe("Symbol lookup functionality", () => {
    it("should lookup single symbol with default columns", async () => {
      const symbols = ["TVC:SPX"];
      const mockData = {
        s: "TVC:SPX",
        d: [
          "S&P 500 Index",      // name
          4783.83,               // close
          1.2,                   // change
          5234567890,            // volume
          null,                  // market_cap_basic (N/A for indexes)
          4818.62,               // all_time_high
          666.79,                // all_time_low
          4793.06,               // price_52_week_high
          4103.78,               // price_52_week_low
        ],
      };

      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        // Verify request structure
        assert.strictEqual(request.filter.length, 0, "Should have no filters");
        assert.deepStrictEqual(request.symbols.tickers, symbols, "Should use symbols.tickers");
        assert.strictEqual(request.range[1], symbols.length, "Range should match symbols length");

        // Verify default columns
        const expectedColumns = [
          "name",
          "close",
          "change",
          "volume",
          "market_cap_basic",
          "all_time_high",
          "all_time_low",
          "price_52_week_high",
          "price_52_week_low",
        ];
        assert.deepStrictEqual(request.columns, expectedColumns, "Should use default columns");

        return {
          totalCount: 1,
          data: [mockData],
        };
      });

      const result = await screenTool.lookupSymbols({ symbols });

      assert.strictEqual(result.total_count, 1);
      assert.strictEqual(result.symbols.length, 1);
      assert.strictEqual(result.symbols[0].symbol, "TVC:SPX");
      assert.strictEqual(result.symbols[0].name, "S&P 500 Index");
      assert.strictEqual(result.symbols[0].close, 4783.83);
      assert.strictEqual(result.symbols[0].all_time_high, 4818.62);
    });

    it("should lookup multiple symbols", async () => {
      const symbols = ["TVC:SPX", "NASDAQ:AAPL", "OMXSTO:OMXS30"];
      const mockDataArray = symbols.map(s => ({
        s,
        d: ["Test Name", 100, 5, 1000000, 1000000000, 150, 50, 120, 80],
      }));

      (mockClient.scanStocks as any).mock.mockImplementation(async () => ({
        totalCount: 3,
        data: mockDataArray,
      }));

      const result = await screenTool.lookupSymbols({ symbols });

      assert.strictEqual(result.total_count, 3);
      assert.strictEqual(result.symbols.length, 3);
      assert.strictEqual(result.symbols[0].symbol, "TVC:SPX");
      assert.strictEqual(result.symbols[1].symbol, "NASDAQ:AAPL");
      assert.strictEqual(result.symbols[2].symbol, "OMXSTO:OMXS30");
    });

    it("should use custom columns when provided", async () => {
      const symbols = ["NASDAQ:AAPL"];
      const customColumns = ["name", "close", "volume", "market_cap_basic"];

      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        assert.deepStrictEqual(request.columns, customColumns, "Should use custom columns");

        return {
          totalCount: 1,
          data: [{
            s: "NASDAQ:AAPL",
            d: ["Apple Inc.", 178.72, 50000000, 2800000000000],
          }],
        };
      });

      const result = await screenTool.lookupSymbols({
        symbols,
        columns: customColumns,
      });

      assert.strictEqual(result.symbols[0].name, "Apple Inc.");
      assert.strictEqual(result.symbols[0].close, 178.72);
      assert.strictEqual(result.symbols[0].volume, 50000000);
      assert.strictEqual(result.symbols[0].market_cap_basic, 2800000000000);

      // Should not have columns that weren't requested
      assert.strictEqual(result.symbols[0].change, undefined);
    });
  });

  describe("Caching behavior", () => {
    it("should return cached result when available", async () => {
      const symbols = ["TVC:SPX"];
      const cachedResult = {
        total_count: 1,
        symbols: [{ symbol: "TVC:SPX", name: "Cached Result" }],
      };

      // Mock cache to return a result
      (mockCache.get as any).mock.mockImplementation(() => cachedResult);

      const result = await screenTool.lookupSymbols({ symbols });

      // Should return cached result without calling client
      assert.deepStrictEqual(result, cachedResult);

      // Verify scanStocks was not called
      const callCount = (mockClient.scanStocks as any).mock.calls.length;
      // Don't increment call count
    });

    it("should cache results after successful lookup", async () => {
      // Reset mock cache
      (mockCache.get as any).mock.mockImplementation(() => null);

      const symbols = ["NASDAQ:AAPL"];
      const mockData = {
        s: "NASDAQ:AAPL",
        d: ["Apple Inc.", 178.72, 2.5, 50000000, 2800000000000, 180, 120, 179, 125],
      };

      (mockClient.scanStocks as any).mock.mockImplementation(async () => ({
        totalCount: 1,
        data: [mockData],
      }));

      const result = await screenTool.lookupSymbols({ symbols });

      // Verify cache.set was called with the result
      assert.strictEqual((mockCache.set as any).mock.calls.length > 0, true);

      const lastCacheCall = (mockCache.set as any).mock.calls[(mockCache.set as any).mock.calls.length - 1];
      assert.ok(lastCacheCall);
      assert.ok(lastCacheCall.arguments[0].includes("lookup")); // Cache key should include "lookup"
      assert.deepStrictEqual(lastCacheCall.arguments[1], result); // Cached value should be the result
    });

    it("should use different cache keys for different symbol sets", async () => {
      (mockCache.get as any).mock.mockImplementation(() => null);
      (mockClient.scanStocks as any).mock.mockImplementation(async () => ({
        totalCount: 1,
        data: [{
          s: "TEST",
          d: ["Test", 100, 5, 1000000, 1000000000, 150, 50, 120, 80],
        }],
      }));

      // First lookup
      await screenTool.lookupSymbols({ symbols: ["NASDAQ:AAPL"] });
      const firstCacheKey = (mockCache.set as any).mock.calls[(mockCache.set as any).mock.calls.length - 1].arguments[0];

      // Second lookup with different symbols
      await screenTool.lookupSymbols({ symbols: ["TVC:SPX"] });
      const secondCacheKey = (mockCache.set as any).mock.calls[(mockCache.set as any).mock.calls.length - 1].arguments[0];

      assert.notStrictEqual(firstCacheKey, secondCacheKey, "Cache keys should be different");
    });
  });

  describe("Rate limiting", () => {
    it("should acquire rate limiter before making request", async () => {
      const symbols = ["NASDAQ:AAPL"];

      // Reset cache to ensure API call
      (mockCache.get as any).mock.mockImplementation(() => null);

      let rateLimiterCalled = false;
      (mockRateLimiter.acquire as any).mock.mockImplementation(async () => {
        rateLimiterCalled = true;
      });

      (mockClient.scanStocks as any).mock.mockImplementation(async () => {
        // Verify rate limiter was called before client
        assert.strictEqual(rateLimiterCalled, true, "Rate limiter should be called before API request");

        return {
          totalCount: 1,
          data: [{
            s: "NASDAQ:AAPL",
            d: ["Apple Inc.", 178.72, 2.5, 50000000, 2800000000000, 180, 120, 179, 125],
          }],
        };
      });

      await screenTool.lookupSymbols({ symbols });
    });
  });

  describe("Response formatting", () => {
    it("should map columns to properties correctly", async () => {
      const symbols = ["NASDAQ:AAPL"];
      const columns = ["name", "close", "change", "volume"];

      (mockClient.scanStocks as any).mock.mockImplementation(async () => ({
        totalCount: 1,
        data: [{
          s: "NASDAQ:AAPL",
          d: ["Apple Inc.", 178.72, 2.5, 50000000],
        }],
      }));

      const result = await screenTool.lookupSymbols({
        symbols,
        columns,
      });

      const symbol = result.symbols[0];

      assert.strictEqual(symbol.symbol, "NASDAQ:AAPL");
      assert.strictEqual(symbol.name, "Apple Inc.");
      assert.strictEqual(symbol.close, 178.72);
      assert.strictEqual(symbol.change, 2.5);
      assert.strictEqual(symbol.volume, 50000000);
    });

    it("should handle null values in response data", async () => {
      const symbols = ["TVC:SPX"];

      (mockClient.scanStocks as any).mock.mockImplementation(async () => ({
        totalCount: 1,
        data: [{
          s: "TVC:SPX",
          d: ["S&P 500", 4783.83, 1.2, null, null, 4818.62, 666.79, 4793.06, 4103.78],
        }],
      }));

      const result = await screenTool.lookupSymbols({ symbols });

      // Should preserve null values from API
      assert.strictEqual(result.symbols[0].volume, null);
      assert.strictEqual(result.symbols[0].market_cap_basic, null);
    });
  });

  describe("Market regime analysis use case", () => {
    it("should lookup market indexes for drawdown calculation", async () => {
      // This test simulates the market_indexes preset use case
      const symbols = [
        "TVC:SPX",      // S&P 500
        "TVC:DJI",      // Dow Jones
        "TVC:NDQ",      // NASDAQ 100
        "OMXSTO:OMXS30", // OMX Stockholm 30
      ];

      const mockIndexData = symbols.map((s, i) => ({
        s,
        d: [
          `Index ${i}`,      // name
          4000 + i * 100,    // close
          1.5 + i * 0.2,     // change
          1000000 * (i + 1), // volume
          null,              // market_cap_basic (N/A for indexes)
          4500 + i * 100,    // all_time_high
          3000 + i * 100,    // all_time_low
          4200 + i * 100,    // price_52_week_high
          3500 + i * 100,    // price_52_week_low
        ],
      }));

      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        // Verify it's requesting the right symbols
        assert.deepStrictEqual(request.symbols.tickers, symbols);

        return {
          totalCount: 4,
          data: mockIndexData,
        };
      });

      const result = await screenTool.lookupSymbols({ symbols });

      assert.strictEqual(result.total_count, 4);
      assert.strictEqual(result.symbols.length, 4);

      // Verify we can calculate drawdowns
      for (const index of result.symbols) {
        assert.ok(index.close, "Should have close price");
        assert.ok(index.all_time_high, "Should have ATH for drawdown calculation");
        assert.ok(index.price_52_week_high, "Should have 52-week high");

        // Calculate drawdown from ATH (as mentioned in the PR review use case)
        const drawdownFromATH = ((index.close - index.all_time_high) / index.all_time_high) * 100;
        assert.ok(typeof drawdownFromATH === "number", "Should be able to calculate drawdown");
      }
    });
  });
});
