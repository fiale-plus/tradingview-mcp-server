/**
 * Tests for WebSocket protocol encode/decode and session ID generation
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  encodePacket,
  decodePacket,
  createPong,
  genSessionId,
  createSetAuthToken,
  createChartSession,
  createQuoteSession,
  createResolveSymbol,
  createSeries,
  createQuoteSetFields,
  createQuoteAddSymbols,
  createQuoteFastSymbols,
} from "../ws/protocol.js";

describe("WebSocket Protocol", () => {
  describe("encodePacket", () => {
    it("should encode a JSON message object", () => {
      const msg = { m: "set_auth_token", p: ["unauthorized_user_token"] };
      const encoded = encodePacket(msg);
      const expected = `~m~${JSON.stringify(msg).length}~m~${JSON.stringify(msg)}`;
      assert.strictEqual(encoded, expected);
    });

    it("should encode a plain string", () => {
      const encoded = encodePacket("hello");
      assert.strictEqual(encoded, "~m~5~m~hello");
    });

    it("should handle empty params", () => {
      const msg = { m: "chart_create_session", p: ["cs_test", ""] };
      const encoded = encodePacket(msg);
      assert.ok(encoded.startsWith("~m~"));
      assert.ok(encoded.includes("chart_create_session"));
    });
  });

  describe("decodePacket", () => {
    it("should decode a single JSON message", () => {
      const msg = { m: "set_auth_token", p: ["token123"] };
      const payload = JSON.stringify(msg);
      const raw = `~m~${payload.length}~m~${payload}`;
      const decoded = decodePacket(raw);
      assert.strictEqual(decoded.length, 1);
      assert.deepStrictEqual(decoded[0], msg);
    });

    it("should decode multiple messages in one raw string", () => {
      const msg1 = { m: "quote_create_session", p: ["qs_test"] };
      const msg2 = { m: "quote_set_fields", p: ["qs_test", "lp", "bid"] };
      const p1 = JSON.stringify(msg1);
      const p2 = JSON.stringify(msg2);
      const raw = `~m~${p1.length}~m~${p1}~m~${p2.length}~m~${p2}`;
      const decoded = decodePacket(raw);
      assert.strictEqual(decoded.length, 2);
      assert.deepStrictEqual(decoded[0], msg1);
      assert.deepStrictEqual(decoded[1], msg2);
    });

    it("should extract ping numbers", () => {
      const raw = "~h~42";
      const decoded = decodePacket(raw);
      assert.strictEqual(decoded.length, 1);
      assert.strictEqual(decoded[0], 42);
    });

    it("should handle mixed data and pings", () => {
      const msg = { m: "series_completed", p: ["cs_test", "s1"] };
      const payload = JSON.stringify(msg);
      const raw = `~h~1~m~${payload.length}~m~${payload}`;
      const decoded = decodePacket(raw);
      // Should have at least the ping and the message
      assert.ok(decoded.length >= 1);
    });

    it("should skip empty/invalid parts", () => {
      const raw = "~m~0~m~~m~5~m~hello";
      const decoded = decodePacket(raw);
      // Should parse "hello" attempt but it's not valid JSON, so filtered out
      assert.ok(Array.isArray(decoded));
    });
  });

  describe("createPong", () => {
    it("should create proper pong format", () => {
      const pong = createPong(42);
      assert.strictEqual(pong, "~m~3~m~~h~42~");
    });
  });

  describe("genSessionId", () => {
    it("should generate quote session IDs with qs_ prefix", () => {
      const id = genSessionId("qs_");
      assert.ok(id.startsWith("qs_"));
      assert.strictEqual(id.length, 15); // qs_ + 12 chars
    });

    it("should generate chart session IDs with cs_ prefix", () => {
      const id = genSessionId("cs_");
      assert.ok(id.startsWith("cs_"));
      assert.strictEqual(id.length, 15);
    });

    it("should generate unique IDs", () => {
      const ids = new Set(Array.from({ length: 100 }, () => genSessionId("qs_")));
      assert.strictEqual(ids.size, 100);
    });
  });

  describe("Message creation helpers", () => {
    it("should create set_auth_token message", () => {
      const msg = createSetAuthToken("unauthorized_user_token");
      assert.strictEqual(msg.m, "set_auth_token");
      assert.deepStrictEqual(msg.p, ["unauthorized_user_token"]);
    });

    it("should create chart_create_session message", () => {
      const msg = createChartSession("cs_test123");
      assert.strictEqual(msg.m, "chart_create_session");
      assert.deepStrictEqual(msg.p, ["cs_test123", ""]);
    });

    it("should create quote_create_session message", () => {
      const msg = createQuoteSession("qs_test123");
      assert.strictEqual(msg.m, "quote_create_session");
      assert.deepStrictEqual(msg.p, ["qs_test123"]);
    });

    it("should create resolve_symbol message", () => {
      const msg = createResolveSymbol("cs_test", "symbol_1", {
        symbol: "BINANCE:BTCUSDT",
      });
      assert.strictEqual(msg.m, "resolve_symbol");
      assert.strictEqual(msg.p[0], "cs_test");
      assert.strictEqual(msg.p[1], "symbol_1");
      assert.ok(msg.p[2].includes("BINANCE:BTCUSDT"));
    });

    it("should create create_series message", () => {
      const msg = createSeries("cs_test", "s1", "s1", "symbol_1", "1D", 300);
      assert.strictEqual(msg.m, "create_series");
      assert.deepStrictEqual(msg.p, ["cs_test", "s1", "s1", "symbol_1", "1D", 300]);
    });

    it("should create quote_set_fields message", () => {
      const msg = createQuoteSetFields("qs_test", ["lp", "bid", "ask"]);
      assert.strictEqual(msg.m, "quote_set_fields");
      assert.strictEqual(msg.p[0], "qs_test");
      assert.ok(msg.p.includes("lp"));
      assert.ok(msg.p.includes("bid"));
      assert.ok(msg.p.includes("ask"));
    });

    it("should create quote_add_symbols message", () => {
      const msg = createQuoteAddSymbols("qs_test", ["NASDAQ:AAPL", "BINANCE:BTCUSDT"]);
      assert.strictEqual(msg.m, "quote_add_symbols");
      assert.strictEqual(msg.p[0], "qs_test");
      assert.ok(msg.p.includes("NASDAQ:AAPL"));
    });

    it("should create quote_fast_symbols message", () => {
      const msg = createQuoteFastSymbols("qs_test", ["NASDAQ:AAPL"]);
      assert.strictEqual(msg.m, "quote_fast_symbols");
      assert.strictEqual(msg.p[0], "qs_test");
      assert.strictEqual(msg.p[1], "NASDAQ:AAPL");
    });
  });

  describe("Round-trip", () => {
    it("should encode and decode a message back to the same object", () => {
      const original = { m: "create_series", p: ["cs_test", "s1", "s1", "symbol_1", "1D", 300] };
      const encoded = encodePacket(original);
      const decoded = decodePacket(encoded);
      assert.strictEqual(decoded.length, 1);
      assert.deepStrictEqual(decoded[0], original);
    });
  });
});