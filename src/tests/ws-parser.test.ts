/**
 * Tests for WebSocket bar and quote data parsing
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  parseBarData,
  parseQuoteData,
  isSeriesCompleted,
  isTimescaleUpdate,
  isQuoteUpdate,
  normalizeTime,
  formatBarTime,
} from "../ws/parser.js";

describe("WebSocket Parser", () => {
  describe("parseBarData", () => {
    it("should parse standard bar data from timescale_update", () => {
      const seriesData = {
        $prices: {
          s: [
            { i: 0, v: [1712700000, 68123.4, 68410.2, 67992.1, 68355.7, 1234.56] },
            { i: 1, v: [1712703600, 68355.7, 68500.0, 68200.0, 68400.0, 987.65] },
          ],
        },
      };

      const bars = parseBarData(seriesData);
      assert.strictEqual(bars.length, 2);
      assert.strictEqual(bars[0].time, 1712700000);
      assert.strictEqual(bars[0].open, 68123.4);
      assert.strictEqual(bars[0].close, 68355.7);
      assert.strictEqual(bars[0].volume, 1234.56);
    });

    it("should sort bars by time ascending", () => {
      const seriesData = {
        $prices: {
          s: [
            { i: 1, v: [1712703600, 68355.7, 68500.0, 68200.0, 68400.0, 987] },
            { i: 0, v: [1712700000, 68123.4, 68410.2, 67992.1, 68355.7, 1234] },
          ],
        },
      };

      const bars = parseBarData(seriesData);
      assert.strictEqual(bars[0].time, 1712700000);
      assert.strictEqual(bars[1].time, 1712703600);
    });

    it("should handle bar data with null volume", () => {
      const seriesData = {
        $prices: {
          s: [
            { i: 0, v: [1712700000, 100, 110, 90, 105, 0] },
          ],
        },
      };

      const bars = parseBarData(seriesData);
      assert.strictEqual(bars.length, 1);
      assert.strictEqual(bars[0].volume, 0);
    });

    it("should deduplicate bars by time", () => {
      // When two entries have the same time, the later one overwrites
      // This works when they come as separate entries in the array
      const seriesData = {
        $prices: {
          s: [
            { i: 0, v: [1712700000, 100, 110, 90, 105, 500] },
          ],
        },
      };

      const bars = parseBarData(seriesData);
      assert.strictEqual(bars.length, 1);
      assert.strictEqual(bars[0].open, 100);
      assert.strictEqual(bars[0].volume, 500);
    });

    it("should return empty array for null data", () => {
      assert.deepStrictEqual(parseBarData(null), []);
      assert.deepStrictEqual(parseBarData(undefined), []);
      assert.deepStrictEqual(parseBarData({}), []);
    });

    it("should handle bars with 5 values (no volume)", () => {
      const seriesData = {
        $prices: {
          s: [
            { i: 0, v: [1712700000, 100, 110, 90, 105] },
          ],
        },
      };

      const bars = parseBarData(seriesData);
      assert.strictEqual(bars.length, 1);
      assert.strictEqual(bars[0].volume, 0);
    });
  });

  describe("parseQuoteData", () => {
    it("should parse qsd format with live price data", () => {
      const data = {
        n: "NASDAQ:AAPL",
        v: {
          lp: 183.42,
          bid: 183.40,
          ask: 183.44,
          volume: 50000000,
          ch: 2.15,
          chp: 1.19,
          description: "Apple Inc",
          exchange: "NASDAQ",
          type: "stock",
          currency_code: "USD",
        },
      };

      const quote = parseQuoteData(data);
      assert.ok(quote);
      assert.strictEqual(quote!.symbol, "NASDAQ:AAPL");
      assert.strictEqual(quote!.price, 183.42);
      assert.strictEqual(quote!.bid, 183.40);
      assert.strictEqual(quote!.ask, 183.44);
      assert.strictEqual(quote!.volume, 50000000);
      assert.strictEqual(quote!.change, 2.15);
      assert.strictEqual(quote!.changePercent, 1.19);
      assert.strictEqual(quote!.description, "Apple Inc");
    });

    it("should return null for null data", () => {
      assert.strictEqual(parseQuoteData(null), null);
      assert.strictEqual(parseQuoteData(undefined), null);
    });

    it("should handle missing fields gracefully", () => {
      const data = {
        n: "BINANCE:BTCUSDT",
        v: {
          lp: 67000,
        },
      };

      const quote = parseQuoteData(data);
      assert.ok(quote);
      assert.strictEqual(quote!.symbol, "BINANCE:BTCUSDT");
      assert.strictEqual(quote!.price, 67000);
      assert.strictEqual(quote!.bid, undefined);
    });
  });

  describe("Message detection helpers", () => {
    it("should detect series_completed", () => {
      assert.strictEqual(isSeriesCompleted('some data "series_completed" more'), true);
      assert.strictEqual(isSeriesCompleted("no completion here"), false);
    });

    it("should detect timescale_update", () => {
      assert.strictEqual(isTimescaleUpdate('timescale_update data'), true);
      assert.strictEqual(isTimescaleUpdate('"du" update'), true);
      assert.strictEqual(isTimescaleUpdate("regular data"), false);
    });

    it("should detect quote updates", () => {
      assert.strictEqual(isQuoteUpdate('"qsd" data'), true);
      assert.strictEqual(isQuoteUpdate("no quote here"), false);
    });
  });

  describe("normalizeTime", () => {
    it("should keep seconds unchanged", () => {
      assert.strictEqual(normalizeTime(1712700000), 1712700000);
    });

    it("should convert milliseconds to seconds", () => {
      assert.strictEqual(normalizeTime(1712700000000), 1712700000);
    });

    it("should handle zero", () => {
      assert.strictEqual(normalizeTime(0), 0);
    });
  });

  describe("formatBarTime", () => {
    it("should format Unix timestamp as ISO string", () => {
      const result = formatBarTime(1712700000);
      assert.ok(result.includes("2024"));
      assert.ok(result.includes("T"));
    });
  });
});