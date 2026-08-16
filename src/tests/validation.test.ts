import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  validateEmptyToolInput,
  validateListFieldsInput,
  validateLookupInput,
  validateMetainfoInput,
  validatePresetInput,
  validateRankByTAInput,
  validateScreenInput,
  validateSearchInput,
  validateTASummaryInput,
} from "../api/validation.js";
import { OUTPUT_SCHEMAS } from "../api/schemas.js";

describe("MCP input validation", () => {
  it("normalizes an omitted screen filter list and preserves valid options", () => {
    assert.deepEqual(
      validateScreenInput({
        markets: ["america"],
        sort_order: "asc",
        limit: 5,
        columns: ["name", "close"],
      }),
      {
        filters: [],
        markets: ["america"],
        sort_order: "asc",
        limit: 5,
        columns: ["name", "close"],
      }
    );
  });
  it("rejects a null filter list instead of treating it as omitted", () => {
    assert.throws(() => validateScreenInput({ filters: null }), /filters must be an array/);
  });

  it("rejects malformed operator-specific filter values before transport", () => {
    assert.throws(
      () => validateScreenInput({
        filters: [{ field: "close", operator: "above_percent", value: 5 }],
      }),
      /above_percent requires \[field, finite percent\]/
    );
    assert.throws(
      () => validateScreenInput({
        filters: [{ field: "typespecs", operator: "has", value: "common" }],
      }),
      /has requires a non-empty string array/
    );
    assert.throws(
      () => validateScreenInput({
        filters: [{ field: "dividend_yield_recent", operator: "empty", value: null }],
      }),
      /empty does not accept a value/
    );
  });

  it("rejects unknown screen properties and invalid limits", () => {
    assert.throws(() => validateScreenInput({ filters: [], unexpected: true }), /unknown argument 'unexpected'/);
    assert.throws(() => validateScreenInput({ filters: [], limit: 0 }), /limit must be an integer from 1 to 200/);
    assert.throws(() => validateScreenInput({ filters: [], sort_order: "sideways" }), /sort_order must be 'asc' or 'desc'/);
  });

  it("validates lookup and search bounds", () => {
    assert.deepEqual(validateLookupInput({ symbols: ["NASDAQ:AAPL"] }), { symbols: ["NASDAQ:AAPL"] });
    assert.throws(() => validateLookupInput({ symbols: [] }), /symbols must contain 1 to 100/);
    assert.throws(() => validateLookupInput({ symbols: ["NASDAQ:AAPL", 4] }), /symbols must contain/);

    assert.deepEqual(validateSearchInput({ query: "apple", limit: 10, start: 2 }), {
      query: "apple",
      limit: 10,
      start: 2,
    });
    assert.throws(() => validateSearchInput({ query: "", limit: 10 }), /query must be a non-empty string/);
    assert.throws(() => validateSearchInput({ query: "apple", limit: 51 }), /limit must be an integer from 1 to 50/);
    assert.throws(() => validateSearchInput({ query: "apple", start: -1 }), /start must be a non-negative integer/);
    assert.throws(() => validateSearchInput({ query: "apple", asset_type: ["stock"] }), /asset_type must be one of/);
  });

  it("validates metainfo, TA, fields, preset, and empty inputs", () => {
    assert.deepEqual(validateMetainfoInput({ market: "america", mode: "raw" }), {
      market: "america",
      mode: "raw",
    });
    assert.throws(() => validateMetainfoInput({ market: "america", mode: "invalid" }), /mode must be 'summary' or 'raw'/);

    assert.deepEqual(validateTASummaryInput({ symbols: ["NASDAQ:AAPL"] }), {
      symbols: ["NASDAQ:AAPL"],
    });
    assert.throws(() => validateTASummaryInput({ symbols: [], timeframes: ["1D"] }), /symbols must contain 1 to 50/);
    assert.throws(() => validateTASummaryInput({ symbols: ["NASDAQ:AAPL"], timeframes: ["2D"] }), /invalid timeframe '2D'/);

    assert.deepEqual(validateRankByTAInput({ symbols: ["NASDAQ:AAPL"], weights: { "1D": 2 } }), {
      symbols: ["NASDAQ:AAPL"],
      weights: { "1D": 2 },
    });
    assert.throws(() => validateRankByTAInput({ symbols: ["NASDAQ:AAPL"], weights: { "1D": -1 } }), /weights must contain finite non-negative numbers/);

    assert.deepEqual(validateListFieldsInput({ asset_type: "stock", category: "technical" }), {
      asset_type: "stock",
      category: "technical",
    });
    assert.throws(() => validateListFieldsInput({ asset_type: "bond" }), /asset_type must be one of/);
    assert.throws(() => validateListFieldsInput({ asset_type: ["stock"] }), /asset_type must be one of/);
    assert.throws(() => validateListFieldsInput({ category: ["technical"] }), /category must be one of/);

    assert.deepEqual(validatePresetInput({ preset_name: "quality_stocks" }), { preset_name: "quality_stocks" });
    assert.throws(() => validatePresetInput({ preset_name: "" }), /preset_name must be a non-empty string/);
    assert.deepEqual(validateEmptyToolInput({}), {});
    assert.throws(() => validateEmptyToolInput({ extra: true }), /unknown argument 'extra'/);
  });
});

describe("MCP output schemas", () => {
  it("publishes an object output schema for every public tool", () => {
    const toolNames = [
      "screen_stocks",
      "screen_forex",
      "screen_crypto",
      "screen_etf",
      "lookup_symbols",
      "search_symbols",
      "get_market_metainfo",
      "get_ta_summary",
      "rank_by_ta",
      "list_fields",
      "get_preset",
      "list_presets",
    ];

    for (const toolName of toolNames) {
      assert.equal(OUTPUT_SCHEMAS[toolName as keyof typeof OUTPUT_SCHEMAS].type, "object", toolName);
    }
    assert.ok("stocks" in OUTPUT_SCHEMAS.screen_stocks.properties);
    assert.ok("pairs" in OUTPUT_SCHEMAS.screen_forex.properties);
    assert.ok("cryptocurrencies" in OUTPUT_SCHEMAS.screen_crypto.properties);
    assert.ok("etfs" in OUTPUT_SCHEMAS.screen_etf.properties);
  });
});
