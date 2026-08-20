/**
 * ETF taxonomy integration regression. Run only with TV_INTEGRATION=1.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

if (process.env.TV_INTEGRATION !== "1") {
  console.log("Skipping ETF taxonomy integration test (set TV_INTEGRATION=1 to enable)");
  process.exit(0);
}

import { TradingViewClient } from "../../api/client.js";
import { Cache } from "../../utils/cache.js";
import { RateLimiter } from "../../utils/rateLimit.js";
import { ScreenTool } from "../../tools/screen.js";

describe("Integration — screen_etf taxonomy", () => {
  it("does not return known non-ETF fund contamination", { timeout: 30_000 }, async () => {
    const tool = new ScreenTool(
      new TradingViewClient(),
      new Cache(60),
      new RateLimiter(10),
    );
    const result = await tool.screenETF({
      filters: [],
      markets: ["america"],
      sort_by: "market_cap_basic",
      sort_order: "desc",
      limit: 50,
    });

    assert.ok(Array.isArray(result.etfs));
    for (const item of result.etfs) {
      assert.equal(String(item.type).toLowerCase(), "fund");
      assert.equal(String(item.subtype).toLowerCase(), "etf");
      assert.equal(item.etfClassification, "verified");
      assert.notEqual(String(item.symbol), "NYSE:ABC-P");
    }
  });
});
