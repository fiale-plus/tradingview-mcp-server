import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { encodePacket, decodePacket } from "../ws/protocol.js";
import { parseBarData } from "../ws/parser.js";
import { fetchBars, type BarsTransport } from "../ws/client.js";
import { validateBarsInput } from "../api/validation.js";
import { getBars, isExperimentalEnabled } from "../tools/bars.js";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/ajv-provider.js";
import { OUTPUT_SCHEMAS } from "../api/schemas.js";

class FakeTransport extends EventEmitter implements BarsTransport {
  sent: string[] = [];
  terminated = false;
  send(data: string) { this.sent.push(data); }
  terminate() { this.terminated = true; this.emit("close"); }
  message(m: string, p: unknown[]) { this.emit("message", encodePacket({ m, p })); }
  start() {
    this.emit("open");
    const messages = this.sent.flatMap(decodePacket);
    const create = messages.find((message) => typeof message !== "string" && message.m === "chart_create_session");
    assert.ok(create && typeof create !== "string");
    return create.p[0];
  }
}
const input = { symbol: "NASDAQ:AAPL", timeframe: "1D", limit: 2 };

describe("experimental bars protocol", () => {
  it("round trips JSON, combined frames and heartbeat without delimiter corruption", () => {
    const message = { m: "test", p: ["~m~3~m~", "~h~123", "日本語"] };
    assert.deepEqual(decodePacket(encodePacket(message) + encodePacket("~h~12345")), [message, "~h~12345"]);
    assert.deepEqual(decodePacket(encodePacket('{"session_id":"hello"}')), []);
    assert.throws(() => decodePacket("~m~0~m~{}"), /length/);
    assert.throws(() => decodePacket("broken"), /header/);
  });
  it("decodes non-ASCII character and UTF-8 byte lengths, alone and in multi-frame packets", () => {
    for (const text of ["Moët", "Société Générale", "emoji 😀"]) {
      const message = { m: "test", p: [text] };
      const payload = JSON.stringify(message);
      for (const length of [payload.length, Buffer.byteLength(payload)]) {
        const frame = `~m~${length}~m~${payload}`;
        assert.deepEqual(decodePacket(frame), [message]);
        assert.deepEqual(decodePacket(frame + encodePacket("~h~123") + frame), [message, "~h~123", message]);
      }
      const fallback = `~m~9999~m~${payload}`;
      assert.deepEqual(decodePacket(fallback + encodePacket("~h~123")), [message, "~h~123"]);
    }
  });
  it("accepts five-value index rows with null volume", () => {
    assert.deepEqual(parseBarData({ s: [{ v: [10, 1, 3, 0, 2] }] }), [
      { time: 10, open: 1, high: 3, low: 0, close: 2, volume: null },
    ]);
    assert.equal(parseBarData({ s: [{ v: [10, 1, 3, 0, 2, null] }] })[0].volume, null);
    assert.throws(() => parseBarData({ s: [{ v: [10, 1, 3, 0, 2, "bad"] }] }), /OHLCV/);
  });
  it("parses OHLCV in order and deduplicates by time, preserving latest values", () => {
    const first = parseBarData({ s: [{ v: [20, 2, 4, 1, 3, 100.123] }, { v: [10, 1, 3, 0, 2, 50] }] });
    const result = parseBarData({ s: [{ v: [10, 5, 7, 4, 6, 51] }] }, first);
    assert.deepEqual(result.map((bar) => bar.time), [10, 20]);
    assert.equal(result[0].close, 6);
    assert.equal(result[1].volume, 100.123);
    assert.throws(() => parseBarData({ s: [{ v: [10, 1, null, 0, 2, 3] }] }), /OHLCV/);
  });
});

describe("experimental bars client", () => {
  it("fetches through an injected transport, pongs correctly and closes on completion", async () => {
    const socket = new FakeTransport();
    const promise = fetchBars(input, { transportFactory: () => socket });
    const session = socket.start();
    assert.deepEqual(decodePacket(socket.sent[0]), [{ m: "set_auth_token", p: ["unauthorized_user_token"] }]);
    socket.emit("message", encodePacket("~h~123456"));
    assert.equal(socket.sent.at(-1), encodePacket("~h~123456"));
    socket.message("timescale_update", [session, { s1: { s: [{ v: [20, 2, 4, 1, 3, 100] }, { v: [10, 1, 3, 0, 2, 50] }] } }]);
    socket.message("du", [session, { s1: { s: [{ v: [20, 2, 5, 1, 4, 101] }] } }]);
    socket.message("series_completed", ["unrelated", "s1"]);
    assert.equal(socket.terminated, false);
    socket.message("series_completed", [session, "s1"]);
    const bars = await promise;
    assert.deepEqual(bars.map((bar) => bar.time), [10, 20]);
    assert.equal(bars[1].close, 4);
    assert.equal(socket.terminated, true);
  });
  it("keeps only the last limit bars across merges", async () => {
    const socket = new FakeTransport();
    const promise = fetchBars(input, { transportFactory: () => socket });
    const session = socket.start();
    socket.message("timescale_update", [session, { s1: { s: [
      { v: [10, 1, 3, 0, 2] }, { v: [20, 1, 3, 0, 2] }, { v: [30, 1, 3, 0, 2] },
    ] } }]);
    // An older update cannot evict one of the retained newest bars.
    socket.message("du", [session, { s1: { s: [{ v: [5, 1, 3, 0, 2] }] } }]);
    socket.message("series_completed", [session, "s1"]);
    assert.deepEqual((await promise).map((bar) => bar.time), [20, 30]);
  });
  it("rejects zero-bar completion and includes close code and reason", async () => {
    const empty = new FakeTransport();
    const emptyResult = fetchBars(input, { transportFactory: () => empty });
    empty.message("series_completed", [empty.start(), "s1"]);
    await assert.rejects(emptyResult, /no bars returned for NASDAQ:AAPL/);
    const closed = new FakeTransport();
    const closedResult = fetchBars(input, { transportFactory: () => closed });
    closed.emit("close", 1008, Buffer.from("policy denied"));
    await assert.rejects(closedResult, /closed before series completion.*1008.*policy denied/);
  });
  it("truncates embedded upstream error payloads", async () => {
    const socket = new FakeTransport();
    const promise = fetchBars(input, { transportFactory: () => socket });
    socket.message("series_error", [socket.start(), "x".repeat(1000)]);
    await assert.rejects(promise, (error: Error) => {
      assert.match(error.message, /TradingView series_error for NASDAQ:AAPL:/);
      assert.equal(error.message.split(": ").at(-1)!.length, 300);
      return true;
    });
  });
  for (const kind of ["symbol_error", "series_error", "critical_error", "protocol_error"]) {
    it(`surfaces ${kind} and closes`, async () => {
      const socket = new FakeTransport();
      const promise = fetchBars(input, { transportFactory: () => socket });
      const session = socket.start();
      socket.message(kind, [session, "symbol_1", "invalid symbol"]);
      await assert.rejects(promise, new RegExp(`${kind}.*NASDAQ:AAPL`));
      assert.equal(socket.terminated, true);
    });
  }
  it("hard timeout closes even a socket that never opens", async () => {
    const socket = new FakeTransport();
    await assert.rejects(fetchBars(input, { timeoutMs: 10, transportFactory: () => socket }), /timed out/);
    assert.equal(socket.terminated, true);
    socket.emit("open");
    assert.equal(socket.sent.length, 0);
  });
  it("closes on malformed input frames and transport errors", async () => {
    for (const event of ["message", "error", "close"]) {
      const socket = new FakeTransport();
      const promise = fetchBars(input, { transportFactory: () => socket });
      socket.emit(event, event === "error" ? new Error("offline") : "invalid");
      await assert.rejects(promise);
      assert.equal(socket.terminated, true);
    }
  });
  it("validates timeout options before creating a socket", () => {
    for (const timeoutMs of [0, -1, NaN, Infinity, 1.5, 60001]) {
      assert.throws(() => fetchBars(input, { timeoutMs }), /timeoutMs/);
    }
  });
});

describe("experimental bars input and gating", () => {
  it("defaults optional fields and accepts all supported timeframes", () => {
    assert.deepEqual(validateBarsInput({ symbol: "NASDAQ:AAPL" }), { ...input, limit: 300 });
    for (const timeframe of ["1", "3", "5", "15", "30", "45", "60", "120", "180", "240", "1D", "1W", "1M"]) {
      assert.equal(validateBarsInput({ ...input, timeframe }).timeframe, timeframe);
    }
  });
  it("rejects bad symbols, limits, timeframes and unknown properties", () => {
    for (const symbol of [undefined, "", "AAPL", "NASDAQ:", ":AAPL", "NASDAQ:A APL", 3]) {
      assert.throws(() => validateBarsInput({ ...input, symbol }), /symbol/);
    }
    assert.equal(validateBarsInput({ symbol: `X:${"A".repeat(126)}` }).symbol.length, 128);
    assert.throws(() => validateBarsInput({ symbol: `X:${"A".repeat(127)}` }), /symbol.*128/);
    for (const limit of [0, -1, 5001, 1.5, "10", null, NaN, Infinity]) {
      assert.throws(() => validateBarsInput({ ...input, limit }), /limit/);
    }
    for (const timeframe of ["D", "2", 60, null, ""]) {
      assert.throws(() => validateBarsInput({ ...input, timeframe }), /timeframe/);
    }
    assert.throws(() => validateBarsInput({ ...input, cookie: "no" }), /unknown argument/);
    assert.throws(() => validateBarsInput([]), /object/);
  });
  it("only recognizes explicit enable values and refuses disabled direct calls", async () => {
    for (const value of ["1", "true", "yes", "TRUE", "YES"]) assert.equal(isExperimentalEnabled(value), true);
    for (const value of ["", "0", "false", "no", "2"]) assert.equal(isExperimentalEnabled(value), false);
    const previous = process.env.TV_EXPERIMENTAL_ENABLED;
    process.env.TV_EXPERIMENTAL_ENABLED = "0";
    try { await assert.rejects(getBars(input), /disabled/); }
    finally {
      if (previous === undefined) delete process.env.TV_EXPERIMENTAL_ENABLED;
      else process.env.TV_EXPERIMENTAL_ENABLED = previous;
    }
  });
  it("guards concurrency and connection spacing, validates fake-transport output, and releases on error", async (t) => {
    const previous = process.env.TV_EXPERIMENTAL_ENABLED;
    process.env.TV_EXPERIMENTAL_ENABLED = "1";
    try {
      let now = 100_000;
      t.mock.method(Date, "now", () => now);
      const socket = new FakeTransport();
      const promise = getBars(input, { transportFactory: () => socket });
      const forbiddenTransport = () => { throw new Error("must not create a socket"); };
      await assert.rejects(getBars(input, { transportFactory: forbiddenTransport }), /another experimental_get_bars request is in flight/);
      const session = socket.start();
      socket.message("timescale_update", [session, { s1: { s: [{ v: [10, 1, 3, 0, 2] }] } }]);
      socket.message("series_completed", [session, "s1"]);
      const result = await promise;
      assert.equal(result.count, 1);
      assert.equal(result.metadata.source, "experimental_tradingview_ws");
      assert.equal(result.metadata.experimental, true);
      assert.equal(result.metadata.requested_count, 2);
      assert.equal(result.metadata.returned_count, 1);
      assert.ok(Number.isFinite(Date.parse(result.metadata.retrieved_at)));
      const validate = new AjvJsonSchemaValidator().getValidator(OUTPUT_SCHEMAS.experimental_get_bars);
      assert.equal(validate(result).valid, true);
      assert.equal(validate({ ...result, bars: [{ ...result.bars[0], volume: "bad" }] }).valid, false);
      await assert.rejects(getBars(input, { transportFactory: forbiddenTransport }), /retry after 2000ms/);
      now += 1999;
      await assert.rejects(getBars(input, { transportFactory: forbiddenTransport }), /retry after 1ms/);
      now += 1;
      const failing = new FakeTransport();
      const failure = getBars(input, { transportFactory: () => failing });
      failing.emit("error", new Error("offline"));
      await assert.rejects(failure, /offline/);
      now += 2000;
      const next = new FakeTransport();
      const nextResult = getBars(input, { transportFactory: () => next });
      const nextSession = next.start();
      next.message("du", [nextSession, { s1: { s: [{ v: [10, 1, 3, 0, 2, 50] }] } }]);
      next.message("series_completed", [nextSession, "s1"]);
      assert.equal(validate(await nextResult).valid, true);
    } finally {
      if (previous === undefined) delete process.env.TV_EXPERIMENTAL_ENABLED;
      else process.env.TV_EXPERIMENTAL_ENABLED = previous;
    }
  });
});
