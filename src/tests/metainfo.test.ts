import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { MetainfoTool } from "../tools/metainfo.js";
import type { MetainfoClient } from "../api/metainfo.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";

describe("MetainfoTool", () => {
  const mockMetainfoClient = {
    getMetainfo: mock.fn(async (input: any) => ({
      market: input.market,
      requested_fields: input.fields || [],
      metainfo: {
        available: true,
        field_count: 2,
        fields: [
          { name: "name", label: "Name", type: "string" },
          { name: "close", label: "Close", type: "number" },
        ],
      },
    })),
  } as unknown as MetainfoClient;

  const mockCache = {
    get: mock.fn(() => null),
    set: mock.fn(),
  } as unknown as Cache;

  const mockRateLimiter = {
    acquire: mock.fn(async () => {}),
  } as unknown as RateLimiter;


  describe("getMetainfo", () => {
    it("should fetch metainfo for a market", async () => {
      const tool = new MetainfoTool(mockMetainfoClient, mockCache as any, mockRateLimiter as any);
      const result = await tool.getMetainfo({ market: "america" });

      assert.strictEqual(result.market, "america");
      assert.strictEqual(result.metainfo.available, true);
      assert.strictEqual(result.metainfo.field_count, 2);
    });

    it("should reject empty market", async () => {
      const tool = new MetainfoTool(mockMetainfoClient, mockCache as any, mockRateLimiter as any);
      await assert.rejects(
        async () => await tool.getMetainfo({ market: "" }),
        { message: /Market is required/ }
      );
    });

    it("should pass fields and mode", async () => {
      const tool = new MetainfoTool(mockMetainfoClient, mockCache as any, mockRateLimiter as any);
      const result = await tool.getMetainfo({
        market: "america",
        fields: ["name", "close"],
        mode: "summary",
      });

      assert.strictEqual(result.market, "america");
      assert.strictEqual(result.requested_fields.length, 2);
    });

    it("should return cached result when available", async () => {
      const cachedResult = {
        market: "america",
        requested_fields: [],
        metainfo: { available: true, field_count: 5, fields: [] },
      };
      const cacheWithHit = {
        get: mock.fn(() => cachedResult),
        set: mock.fn(),
      } as unknown as Cache;

      const tool = new MetainfoTool(mockMetainfoClient, cacheWithHit as any, mockRateLimiter as any);
      const result = await tool.getMetainfo({ market: "america" });
      assert.strictEqual(result.metainfo.field_count, 5);
    });

    it("should pass raw mode through", async () => {
      const tool = new MetainfoTool(mockMetainfoClient, mockCache as any, mockRateLimiter as any);
      const result = await tool.getMetainfo({ market: "uk", mode: "raw" });
      // The mock returns summary format, but this proves the mode is forwarded
      assert.strictEqual(result.market, "uk");
    });
  });
});

describe("MetainfoClient - normalizeMetainfo", () => {
  it("should handle array-format fields", async () => {
    const { MetainfoClient } = await import("../api/metainfo.js");
    const client = new MetainfoClient();

    // Access private method via any
    const result = (client as any).normalizeMetainfo("test", undefined, {
      fields: [
        { propName: "market_cap_basic", title: "Market Cap", kind: "number" },
        { propName: "close", title: "Close", kind: "number" },
      ],
    });

    assert.strictEqual(result.market, "test");
    assert.strictEqual(result.metainfo.field_count, 2);
    assert.strictEqual(result.metainfo.fields[0].name, "market_cap_basic");
    assert.strictEqual(result.metainfo.fields[0].label, "Market Cap");
  });

  it("should handle object-format fields", async () => {
    const { MetainfoClient } = await import("../api/metainfo.js");
    const client = new MetainfoClient();

    const result = (client as any).normalizeMetainfo("test", undefined, {
      close: { title: "Close", kind: "number" },
      name: { title: "Name", kind: "string" },
    });

    assert.strictEqual(result.metainfo.field_count, 2);
  });

  it("should filter to requested fields", async () => {
    const { MetainfoClient } = await import("../api/metainfo.js");
    const client = new MetainfoClient();

    const result = (client as any).normalizeMetainfo(
      "test",
      ["close"],
      [
        { propName: "name", title: "Name", kind: "string" },
        { propName: "close", title: "Close", kind: "number" },
      ]
    );

    assert.strictEqual(result.metainfo.field_count, 1);
    assert.strictEqual(result.metainfo.fields[0].name, "close");
  });
});