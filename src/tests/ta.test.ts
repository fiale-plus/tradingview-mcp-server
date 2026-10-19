import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { TAClient, scoreToLabel, DEFAULT_TIMEFRAMES, VALID_TIMEFRAMES } from "../api/ta.js";
import { TATool } from "../tools/ta.js";
import type { TradingViewClient } from "../api/client.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";

describe("TA - scoreToLabel", () => {
  it("should map strong_sell for score <= -0.5", () => {
    assert.strictEqual(scoreToLabel(-1), "strong_sell");
    assert.strictEqual(scoreToLabel(-0.5), "strong_sell");
    assert.strictEqual(scoreToLabel(-0.8), "strong_sell");
  });

  it("should map sell for score > -0.5 and <= -0.1", () => {
    assert.strictEqual(scoreToLabel(-0.49), "sell");
    assert.strictEqual(scoreToLabel(-0.1), "sell");
    assert.strictEqual(scoreToLabel(-0.3), "sell");
  });

  it("should map neutral for score > -0.1 and < 0.1", () => {
    assert.strictEqual(scoreToLabel(0), "neutral");
    assert.strictEqual(scoreToLabel(-0.09), "neutral");
    assert.strictEqual(scoreToLabel(0.09), "neutral");
  });

  it("should map buy for score >= 0.1 and < 0.5", () => {
    assert.strictEqual(scoreToLabel(0.1), "buy");
    assert.strictEqual(scoreToLabel(0.49), "buy");
    assert.strictEqual(scoreToLabel(0.3), "buy");
  });

  it("should map strong_buy for score >= 0.5", () => {
    assert.strictEqual(scoreToLabel(0.5), "strong_buy");
    assert.strictEqual(scoreToLabel(1), "strong_buy");
    assert.strictEqual(scoreToLabel(0.8), "strong_buy");
  });
});

describe("TA - constants", () => {
  it("should have default timeframes", () => {
    assert.deepStrictEqual(DEFAULT_TIMEFRAMES, ["60", "240", "1D", "1W"]);
  });

  it("should have valid timeframes including common values", () => {
    assert.ok(VALID_TIMEFRAMES.includes("60"));
    assert.ok(VALID_TIMEFRAMES.includes("1D"));
    assert.ok(VALID_TIMEFRAMES.includes("1W"));
    assert.ok(VALID_TIMEFRAMES.includes("1"));
    assert.ok(VALID_TIMEFRAMES.includes("5"));
  });
});

describe("TAClient - getTASummary", () => {
  const mockResponse = {
    totalCount: 2,
    data: [
      {
        s: "NASDAQ:AAPL",
        d: [
          "Apple Inc",                         // name
          0.62,                                  // Recommend.All|60
          0.33,                                  // Recommend.Other|60
          0.84,                                  // Recommend.MA|60
          0.88,                                  // Recommend.All|240
          0.55,                                  // Recommend.Other|240
          0.96,                                  // Recommend.MA|240
          0.45,                                  // Recommend.All (daily)
          -0.2,                                  // Recommend.Other (daily)
          0.9,                                   // Recommend.MA (daily)
          0.12,                                  // Recommend.All|1W
          0.05,                                  // Recommend.Other|1W
          0.15,                                  // Recommend.MA|1W
        ],
      },
      {
        s: "NASDAQ:MSFT",
        d: [
          "Microsoft Corp",
          -0.62,
          -0.5,
          -0.7,
          -0.3,
          -0.1,
          -0.4,
          -0.1,
          0.0,
          -0.15,
          -0.55,
          -0.3,
          -0.7,
        ],
      },
    ],
  };

  const mockClient = {
    scanStocks: mock.fn(async () => mockResponse),
  } as unknown as TradingViewClient;

  const mockCache = {
    get: mock.fn(() => null),
    set: mock.fn(),
  } as unknown as Cache;

  const mockRateLimiter = {
    acquire: mock.fn(async () => {}),
  } as unknown as RateLimiter;


  it("should request exact columns for default timeframes", async () => {
    const scanStocks = mock.fn(async (_request: { columns: string[] }) => mockResponse);
    const client = { scanStocks } as unknown as TradingViewClient;
    const taClient = new TAClient(client, mockCache, mockRateLimiter);

    const result = await taClient.getTASummary({ symbols: ["NASDAQ:AAPL"] });

    assert.deepStrictEqual(scanStocks.mock.calls[0].arguments[0].columns, [
      "name",
      "Recommend.All|60", "Recommend.Other|60", "Recommend.MA|60",
      "Recommend.All|240", "Recommend.Other|240", "Recommend.MA|240",
      "Recommend.All", "Recommend.Other", "Recommend.MA",
      "Recommend.All|1W", "Recommend.Other|1W", "Recommend.MA|1W",
    ]);
    const daily = result.symbols[0].timeframes["1D"];
    assert.strictEqual(daily.available, true);
    assert.strictEqual(daily.summary, "buy");
    assert.deepStrictEqual(daily.scores, {
      all: 0.45, oscillators: -0.2, moving_averages: 0.9,
    });
  });

  it("should request exact columns for explicit timeframes including daily", async () => {
    const scanStocks = mock.fn(async (_request: { columns: string[] }) => ({
      totalCount: 1,
      data: [{ s: "NASDAQ:AAPL", d: ["Apple", 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, -0.2, -0.3, -0.4] }],
    }));
    const client = { scanStocks } as unknown as TradingViewClient;
    const taClient = new TAClient(client, mockCache, mockRateLimiter);

    const result = await taClient.getTASummary({
      symbols: ["NASDAQ:AAPL"],
      timeframes: ["1D", "1", "1M"],
    });

    assert.deepStrictEqual(scanStocks.mock.calls[0].arguments[0].columns, [
      "name",
      "Recommend.All", "Recommend.Other", "Recommend.MA",
      "Recommend.All|1", "Recommend.Other|1", "Recommend.MA|1",
      "Recommend.All|1M", "Recommend.Other|1M", "Recommend.MA|1M",
    ]);
    assert.strictEqual(result.symbols[0].timeframes["1D"].scores.all, 0.2);
    assert.strictEqual(result.symbols[0].timeframes["1"].scores.all, 0.5);
    assert.strictEqual(result.symbols[0].timeframes["1M"].scores.all, -0.2);
  });

  it("should get TA summary for symbols", async () => {
    const taClient = new TAClient(mockClient, mockCache as any, mockRateLimiter as any);
    const result = await taClient.getTASummary({
      symbols: ["NASDAQ:AAPL", "NASDAQ:MSFT"],
      timeframes: ["60", "240", "1D", "1W"],
    });

    assert.strictEqual(result.symbols.length, 2);

    const aapl = result.symbols[0];
    assert.strictEqual(aapl.symbol, "NASDAQ:AAPL");
    assert.strictEqual(aapl.timeframes["60"].summary, "strong_buy");
    assert.strictEqual(aapl.timeframes["60"].scores.all, 0.62);
    assert.strictEqual(aapl.timeframes["1W"].summary, "buy");
  });

  it("should include components when requested", async () => {
    const taClient = new TAClient(mockClient, mockCache as any, mockRateLimiter as any);
    const result = await taClient.getTASummary({
      symbols: ["NASDAQ:AAPL"],
      include_components: true,
    });

    const aapl = result.symbols[0];
    assert.ok(aapl.timeframes["60"].scores.oscillators !== undefined);
    assert.ok(aapl.timeframes["60"].scores.moving_averages !== undefined);
  });

  it("should exclude components when not requested", async () => {
    const taClient = new TAClient(mockClient, mockCache as any, mockRateLimiter as any);
    const result = await taClient.getTASummary({
      symbols: ["NASDAQ:AAPL"],
      include_components: false,
    });

    const aapl = result.symbols[0];
    assert.strictEqual(aapl.timeframes["60"].scores.oscillators, undefined);
    assert.strictEqual(aapl.timeframes["60"].scores.moving_averages, undefined);
    assert.strictEqual(aapl.timeframes["60"].scores.all, 0.62);
  });

  it("should reject empty symbols", async () => {
    const taClient = new TAClient(mockClient, mockCache as any, mockRateLimiter as any);
    await assert.rejects(
      async () => await taClient.getTASummary({ symbols: [] }),
      { message: /At least one symbol is required/ }
    );
  });

  it("should reject > 50 symbols", async () => {
    const taClient = new TAClient(mockClient, mockCache as any, mockRateLimiter as any);
    const manySymbols = Array.from({ length: 51 }, (_, i) => `SYM${i}`);
    await assert.rejects(
      async () => await taClient.getTASummary({ symbols: manySymbols }),
      { message: /Maximum 50 symbols allowed/ }
    );
  });

  it("should reject invalid timeframes", async () => {
    const taClient = new TAClient(mockClient, mockCache as any, mockRateLimiter as any);
    await assert.rejects(
      async () => await taClient.getTASummary({
        symbols: ["NASDAQ:AAPL"],
        timeframes: ["60", "invalid_tf" as any],
      }),
      { message: /Invalid timeframe/ }
    );
  });

  it("should handle null scores gracefully", async () => {
    const nullMockResponse = {
      totalCount: 1,
      data: [
        {
          s: "NASDAQ:NULL",
          d: [
            "Null Corp",
            null,   // Recommend.All|60
            null,   // Recommend.Other|60
            null,   // Recommend.MA|60
          ],
        },
      ],
    };

    const nullClient = {
      scanStocks: mock.fn(async () => nullMockResponse),
    } as unknown as TradingViewClient;

    const taClient = new TAClient(nullClient, mockCache as any, mockRateLimiter as any);
    const result = await taClient.getTASummary({
      symbols: ["NASDAQ:NULL"],
      timeframes: ["60"],
    });
    const symbol = result.symbols[0];

    assert.strictEqual(symbol.timeframes["60"].summary, "unavailable");
    assert.strictEqual(symbol.timeframes["60"].available, false);
    assert.strictEqual(symbol.timeframes["60"].scores.all, null);
  });
});

describe("TAClient - rankByTA", () => {
  const mockResponse = {
    totalCount: 3,
    data: [
      {
        s: "NASDAQ:NVDA",
        d: ["NVIDIA", 0.71, 0.5, 0.82, 0.89, 0.6, 0.95],
      },
      {
        s: "NASDAQ:AAPL",
        d: ["Apple", 0.62, 0.33, 0.84, 0.45, 0.2, 0.6],
      },
      {
        s: "NASDAQ:MSFT",
        d: ["Microsoft", -0.1, 0.0, -0.15, -0.3, -0.2, -0.4],
      },
    ],
  };

  const mockClient = {
    scanStocks: mock.fn(async () => mockResponse),
  } as unknown as TradingViewClient;

  const mockCache = {
    get: mock.fn(() => null),
    set: mock.fn(),
  } as unknown as Cache;

  const mockRateLimiter = {
    acquire: mock.fn(async () => {}),
  } as unknown as RateLimiter;


  it("should rank symbols by TA score", async () => {
    const taClient = new TAClient(mockClient, mockCache as any, mockRateLimiter as any);
    const result = await taClient.rankByTA({
      symbols: ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:NVDA"],
      timeframes: ["60", "240"],
    });

    assert.strictEqual(result.ranked.length, 3);
    // NVDA should be ranked first (highest scores)
    assert.strictEqual(result.ranked[0].symbol, "NASDAQ:NVDA");
    // Ranked descending by score
    assert.ok(result.ranked[0].score >= result.ranked[1].score);
    assert.ok(result.ranked[1].score >= result.ranked[2].score);
  });

  it("should apply custom weights", async () => {
    const taClient = new TAClient(mockClient, mockCache as any, mockRateLimiter as any);
    const result = await taClient.rankByTA({
      symbols: ["NASDAQ:AAPL", "NASDAQ:NVDA"],
      timeframes: ["60", "240"],
      weights: { "60": 1, "240": 3 },
    });

    assert.strictEqual(result.weights["60"], 1);
    assert.strictEqual(result.weights["240"], 3);
    assert.strictEqual(result.ranked.length, 2);
  });

  it("should use equal weights by default", async () => {
    const taClient = new TAClient(mockClient, mockCache as any, mockRateLimiter as any);
    const result = await taClient.rankByTA({
      symbols: ["NASDAQ:AAPL"],
      timeframes: ["60", "240"],
    });

    assert.strictEqual(result.weights["60"], 1);
    assert.strictEqual(result.weights["240"], 1);
  });

  it("should include breakdown per timeframe", async () => {
    const taClient = new TAClient(mockClient, mockCache as any, mockRateLimiter as any);
    const result = await taClient.rankByTA({
      symbols: ["NASDAQ:NVDA"],
      timeframes: ["60", "240"],
    });

    const nvda = result.ranked.find((s) => s.symbol === "NASDAQ:NVDA");
    assert.ok(nvda);
    assert.ok(typeof nvda.breakdown["60"] === "number");
    assert.ok(typeof nvda.breakdown["240"] === "number");
    assert.ok(typeof nvda.score === "number");
    assert.ok(typeof nvda.label === "string");
  });
});

describe("TATool - wrapper", () => {
  const mockResponse = {
    totalCount: 1,
    data: [
      { s: "NASDAQ:AAPL", d: ["Apple", 0.5, 0.3, 0.6, 0.6, 0.4, 0.7, 0.4, 0.1, 0.5, 0.2, 0.0, 0.3] },
    ],
  };

  const mockClient = {
    scanStocks: mock.fn(async () => mockResponse),
  } as unknown as TradingViewClient;

  const mockCache = {
    get: mock.fn(() => null),
    set: mock.fn(),
  } as unknown as Cache;

  const mockRateLimiter = {
    acquire: mock.fn(async () => {}),
  } as unknown as RateLimiter;


  it("should delegate to TAClient.getTASummary", async () => {
    const tool = new TATool(mockClient, mockCache as any, mockRateLimiter as any);
    const result = await tool.getTASummary({
      symbols: ["NASDAQ:AAPL"],
    });

    assert.strictEqual(result.symbols.length, 1);
    assert.strictEqual(result.symbols[0].symbol, "NASDAQ:AAPL");
  });

  it("should delegate to TAClient.rankByTA", async () => {
    const tool = new TATool(mockClient, mockCache as any, mockRateLimiter as any);
    const result = await tool.rankByTA({
      symbols: ["NASDAQ:AAPL"],
    });

    assert.ok(result.ranked);
    assert.strictEqual(result.ranked.length, 1);
  });
});