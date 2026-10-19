import { it } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

for (const request of [
  { symbol: "NASDAQ:AAPL", timeframe: "1D", limit: 10 },
  { symbol: "TVC:SPX", timeframe: "1D", limit: 10 },
  { symbol: "BINANCE:BTCUSDT", timeframe: "60", limit: 20 },
]) {
  it(`anonymous live bars: ${request.symbol} ${request.timeframe}`, {
    skip: process.env.TV_INTEGRATION !== "1" ? "Set TV_INTEGRATION=1 to run live tests" : false,
    timeout: 25_000,
  }, async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx/esm", "src/index.ts"],
      cwd: fileURLToPath(new URL("../../..", import.meta.url)),
      env: { TV_EXPERIMENTAL_ENABLED: "1" },
      stderr: "pipe",
    });
    const client = new Client({ name: "live-bars-test", version: "1.0.0" });
    try {
      await client.connect(transport);
      await client.listTools(); // Register and exercise SDK output-schema validation.
      const result = await client.callTool({ name: "experimental_get_bars", arguments: request });
      assert.notEqual(result.isError, true, JSON.stringify(result.content));
      const output = result.structuredContent as Record<string, unknown>;
      assert.ok(output);
      assert.equal(output.symbol, request.symbol);
      assert.equal(output.timeframe, request.timeframe);
      assert.ok(Array.isArray(output.bars));
      assert.equal(output.count, output.bars.length);
      assert.ok(output.bars.length > 0 && output.bars.length <= request.limit);
      let previous = -1;
      for (const bar of output.bars as Array<{ time: number; open: number; high: number; low: number; close: number; volume: number | null }>) {
        assert.deepEqual(Object.keys(bar).sort(), ["time", "open", "high", "low", "close", "volume"].sort());
        for (const [key, value] of Object.entries(bar)) {
          assert.ok(key === "volume" && value === null || typeof value === "number" && Number.isFinite(value));
        }
        assert.ok(Number.isInteger(bar.time) && bar.time > previous && bar.time < 1e12);
        if (request.timeframe === "1D") {
          assert.ok(bar.high >= Math.max(bar.open, bar.close, bar.low));
          assert.ok(bar.low <= Math.min(bar.open, bar.close, bar.high));
        }
        previous = bar.time;
      }
      const metadata = output.metadata as Record<string, unknown>;
      assert.equal(metadata.source, "experimental_tradingview_ws");
      assert.equal(metadata.experimental, true);
      assert.equal(metadata.requested_count, request.limit);
      assert.equal(metadata.returned_count, output.count);
      assert.ok(Number.isFinite(Date.parse(metadata.retrieved_at as string)));
      const content = result.content as Array<{ type: string; text?: string }>;
      assert.deepEqual(JSON.parse(content[0].text!), output);
    } finally { await client.close(); }
  });
}
