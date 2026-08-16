import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import {
  requestJson,
  UpstreamError,
  type FetchLike,
} from "../api/transport.js";
import { TradingViewClient } from "../api/client.js";
import { SearchClient } from "../api/search.js";
import { MetainfoClient } from "../api/metainfo.js";
import type { RateLimiter } from "../utils/rateLimit.js";
import { loadRuntimeConfig } from "../config.js";

function response(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 503 ? "Service Unavailable" : "OK",
    json: async () => payload,
  };
}

describe("bounded upstream transport", () => {
  it("retries transient HTTP failures and returns the first successful payload", async () => {
    let attempts = 0;
    const fetchImpl = mock.fn(async () => {
      attempts += 1;
      return attempts === 1 ? response(503, { error: "busy" }) : response(200, { ok: true });
    }) as unknown as FetchLike;

    const result = await requestJson(
      "https://example.test/scan",
      { method: "GET" },
      { fetchImpl, retryDelayMs: 0 },
    );

    assert.deepEqual(result, { ok: true });
    assert.equal(attempts, 2);
  });

  it("stops after the bounded retry budget", async () => {
    let attempts = 0;
    const fetchImpl = mock.fn(async () => {
      attempts += 1;
      return response(503, { error: "busy" });
    }) as unknown as FetchLike;

    await assert.rejects(
      () => requestJson("https://example.test/scan", { method: "GET" }, { fetchImpl, retryDelayMs: 0 }),
      (error: unknown) => error instanceof UpstreamError
        && error.kind === "http"
        && error.status === 503,
    );
    assert.equal(attempts, 3);
  });

  it("charges the shared rate limiter for each retry without retrying input validation errors", async () => {
    const rateLimiter = { acquire: mock.fn(async () => {}) };
    let attempts = 0;
    const fetchImpl = mock.fn(async () => {
      attempts += 1;
      return attempts === 1 ? response(500, {}) : response(200, { ok: true });
    }) as unknown as FetchLike;

    await requestJson(
      "https://example.test/scan",
      { method: "GET" },
      { fetchImpl, rateLimiter: rateLimiter as unknown as RateLimiter, retryDelayMs: 0 },
    );
    assert.equal(rateLimiter.acquire.mock.calls.length, 1);

    const search = new SearchClient({ fetchImpl, maxRetries: 2, retryDelayMs: 0 });
    await assert.rejects(() => search.searchSymbols({ query: " " }), /at least 1 character/);
    assert.equal(attempts, 2);
  });

  it("does not retry malformed JSON or caller-independent response parsing failures", async () => {
    let attempts = 0;
    const fetchImpl = mock.fn(async () => {
      attempts += 1;
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => {
          throw new SyntaxError("invalid JSON");
        },
      };
    }) as unknown as FetchLike;

    await assert.rejects(
      () => requestJson("https://example.test/scan", { method: "GET" }, { fetchImpl, retryDelayMs: 0 }),
      (error: unknown) => error instanceof UpstreamError && error.kind === "parse",
    );
    assert.equal(attempts, 1);
  });

  it("normalizes timeout failures without an unbounded retry loop", async () => {
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    const fetchImpl = mock.fn(async () => {
      throw abortError;
    }) as unknown as FetchLike;

    await assert.rejects(
      () => requestJson(
        "https://example.test/scan",
        { method: "GET" },
        { fetchImpl, maxRetries: 0, retryDelayMs: 0 },
      ),
      (error: unknown) => error instanceof UpstreamError
        && error.kind === "timeout"
        && /timed out/.test(error.message),
    );
  });
  it("retries a transient response-body timeout", async () => {
    let attempts = 0;
    const abortError = Object.assign(new Error("body aborted"), { name: "AbortError" });
    const fetchImpl = mock.fn(async () => {
      attempts += 1;
      if (attempts === 1) {
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => {
            throw abortError;
          },
        };
      }
      return response(200, { ok: true });
    }) as unknown as FetchLike;

    const result = await requestJson(
      "https://example.test/scan",
      { method: "GET" },
      { fetchImpl, retryDelayMs: 0 },
    );

    assert.deepEqual(result, { ok: true });
    assert.equal(attempts, 2);
  });
});

describe("upstream response-shape validation", () => {
  it("rejects malformed screener payloads instead of treating them as empty data", async () => {
    const fetchImpl = mock.fn(async () => response(200, { totalCount: 1, data: [{ s: "NASDAQ:AAPL" }] })) as unknown as FetchLike;
    const client = new TradingViewClient({ fetchImpl, maxRetries: 0 });

    await assert.rejects(
      () => client.scanStocks({
        filter: [],
        columns: ["name"],
        sort: { sortBy: "name", sortOrder: "asc" },
        range: [0, 1],
      }),
      /malformed screener response/,
    );
  });

  it("accepts boolean screener cells used by metadata fields", async () => {
    const fetchImpl = mock.fn(async () => response(200, {
      totalCount: 1,
      data: [{ s: "NASDAQ:AAPL", d: ["Apple", true] }],
    })) as unknown as FetchLike;
    const client = new TradingViewClient({ fetchImpl, maxRetries: 0 });

    const result = await client.scanStocks({
      filter: [],
      columns: ["name", "is_primary"],
      sort: { sortBy: "name", sortOrder: "asc" },
      range: [0, 1],
    });

    assert.deepEqual(result.data[0].d, ["Apple", true]);
  });

  it("rejects malformed symbol-search payloads", async () => {
    const fetchImpl = mock.fn(async () => response(200, { error: "bad payload" })) as unknown as FetchLike;
    const client = new SearchClient({ fetchImpl, maxRetries: 0 });

    await assert.rejects(
      () => client.searchSymbols({ query: "apple" }),
      /malformed symbol search response/,
    );
  });

  it("rejects malformed metainfo payloads in summary mode", async () => {
    const fetchImpl = mock.fn(async () => response(200, [])) as unknown as FetchLike;
    const client = new MetainfoClient({ fetchImpl, maxRetries: 0 });

    await assert.rejects(
      () => client.getMetainfo({ market: "america" }),
      /malformed metainfo response/,
    );
  });

  it("normalizes supported root-array metainfo payloads", async () => {
    const fetchImpl = mock.fn(async () => response(200, [
      { propName: "close", title: "Close", kind: "number" },
      { propName: "name", title: "Name", kind: "string" },
    ])) as unknown as FetchLike;
    const client = new MetainfoClient({ fetchImpl, maxRetries: 0 });

    const result = await client.getMetainfo({ market: "america" });

    assert.equal(result.metainfo.field_count, 2);
    assert.deepEqual(result.metainfo.fields.map((field) => field.name), ["close", "name"]);
  });
});

describe("client error compatibility", () => {
  const badRequest = () => ({
    ok: false,
    status: 400,
    statusText: "Bad Request",
    json: async () => ({}),
  });

  it("preserves HTTP error messages for all upstream clients", async () => {
    const fetchImpl = mock.fn(async () => badRequest()) as unknown as FetchLike;
    const request = {
      filter: [],
      columns: ["name"],
      sort: { sortBy: "name", sortOrder: "asc" as const },
      range: [0, 1] as [number, number],
    };

    await assert.rejects(
      () => new TradingViewClient({ fetchImpl, maxRetries: 0 }).scanStocks(request),
      { message: "TradingView API error: 400 Bad Request" },
    );
    await assert.rejects(
      () => new SearchClient({ fetchImpl, maxRetries: 0 }).searchSymbols({ query: "apple" }),
      { message: "Symbol search failed: 400 Bad Request" },
    );
    await assert.rejects(
      () => new MetainfoClient({ fetchImpl, maxRetries: 0 }).getMetainfo({ market: "america" }),
      { message: "Metainfo request failed: 400 Bad Request" },
    );
  });

  it("preserves timeout error messages for all upstream clients", async () => {
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    const fetchImpl = mock.fn(async () => {
      throw abortError;
    }) as unknown as FetchLike;
    const request = {
      filter: [],
      columns: ["name"],
      sort: { sortBy: "name", sortOrder: "asc" as const },
      range: [0, 1] as [number, number],
    };

    await assert.rejects(
      () => new TradingViewClient({ fetchImpl, maxRetries: 0 }).scanStocks(request),
      { message: "Request timeout" },
    );
    await assert.rejects(
      () => new SearchClient({ fetchImpl, maxRetries: 0 }).searchSymbols({ query: "apple" }),
      { message: "Symbol search request timeout" },
    );
    await assert.rejects(
      () => new MetainfoClient({ fetchImpl, maxRetries: 0 }).getMetainfo({ market: "america" }),
      { message: "Metainfo request timeout" },
    );
  });
});

describe("runtime configuration validation", () => {
  it("uses documented defaults and accepts the cache disable value", () => {
    assert.deepEqual(loadRuntimeConfig({}), {
      cacheTtlSeconds: 300,
      rateLimitRpm: 10,
    });
    assert.deepEqual(loadRuntimeConfig({ CACHE_TTL_SECONDS: "0", RATE_LIMIT_RPM: "60" }), {
      cacheTtlSeconds: 0,
      rateLimitRpm: 60,
    });
    assert.throws(
      () => loadRuntimeConfig({ RATE_LIMIT_RPM: "" }),
      /RATE_LIMIT_RPM must be an integer between 1 and 60/,
    );
  });

  it("rejects invalid cache TTL and rate-limit settings before startup", () => {
    assert.throws(
      () => loadRuntimeConfig({ CACHE_TTL_SECONDS: "-1" }),
      /CACHE_TTL_SECONDS must be an integer between 0 and 3600/,
    );
    assert.throws(
      () => loadRuntimeConfig({ CACHE_TTL_SECONDS: "3.5" }),
      /CACHE_TTL_SECONDS must be an integer between 0 and 3600/,
    );
    assert.throws(
      () => loadRuntimeConfig({ RATE_LIMIT_RPM: "0" }),
      /RATE_LIMIT_RPM must be an integer between 1 and 60/,
    );
    assert.throws(
      () => loadRuntimeConfig({ RATE_LIMIT_RPM: "fast" }),
      /RATE_LIMIT_RPM must be an integer between 1 and 60/,
    );
  });
});
