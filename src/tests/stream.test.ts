/**
 * Tests for experimental stream tools
 *
 * These test the tool interface and validation without requiring
 * a live WebSocket connection.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { streamQuotes, streamBars } from "../tools/stream.js";

describe("Experimental Stream Tools", () => {
  describe("streamQuotes", () => {
    it("should reject when experimental features are disabled", async () => {
      const original = process.env.TV_EXPERIMENTAL_ENABLED;
      delete process.env.TV_EXPERIMENTAL_ENABLED;
      await assert.rejects(
        async () => streamQuotes({ symbols: ["NASDAQ:AAPL"] }),
        { message: /Experimental features are disabled/ }
      );
      if (original !== undefined) process.env.TV_EXPERIMENTAL_ENABLED = original;
    });

    it("should reject when no symbols provided", async () => {
      const original = process.env.TV_EXPERIMENTAL_ENABLED;
      process.env.TV_EXPERIMENTAL_ENABLED = "1";
      try {
        await streamQuotes({ symbols: [] });
        assert.fail("Should have thrown");
      } catch (err: any) {
        assert.ok(err.message.includes("symbol") || err.message.includes("required") || err.message.includes("Error"));
      }
      if (original !== undefined) process.env.TV_EXPERIMENTAL_ENABLED = original;
      else delete process.env.TV_EXPERIMENTAL_ENABLED;
    });
  });

  describe("streamBars", () => {
    it("should reject when experimental features are disabled", async () => {
      const original = process.env.TV_EXPERIMENTAL_ENABLED;
      delete process.env.TV_EXPERIMENTAL_ENABLED;
      await assert.rejects(
        async () => streamBars({ symbol: "BINANCE:BTCUSDT" }),
        { message: /Experimental features are disabled/ }
      );
      if (original !== undefined) process.env.TV_EXPERIMENTAL_ENABLED = original;
    });

    it("should reject when no symbol provided", async () => {
      const original = process.env.TV_EXPERIMENTAL_ENABLED;
      process.env.TV_EXPERIMENTAL_ENABLED = "1";
      try {
        await streamBars({ symbol: "" });
        assert.fail("Should have thrown");
      } catch (err: any) {
        assert.ok(err.message.includes("symbol") || err.message.includes("required") || err.message.includes("Error"));
      }
      if (original !== undefined) process.env.TV_EXPERIMENTAL_ENABLED = original;
      else delete process.env.TV_EXPERIMENTAL_ENABLED;
    });
  });
});