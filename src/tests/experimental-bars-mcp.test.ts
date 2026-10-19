import { it } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

for (const flag of ["0", "1"]) {
  it(`experimental MCP gate with TV_EXPERIMENTAL_ENABLED=${flag}`, async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx/esm", "src/index.ts"],
      cwd: fileURLToPath(new URL("../..", import.meta.url)),
      env: { TV_EXPERIMENTAL_ENABLED: flag },
      stderr: "pipe",
    });
    const client = new Client({ name: "bars-gate-test", version: "1.0.0" });
    try {
      await client.connect(transport);
      const { tools } = await client.listTools();
      const tool = tools.find((tool) => tool.name === "experimental_get_bars");
      if (flag === "0") assert.equal(tool, undefined);
      else {
        assert.ok(tool);
        assert.equal(tools.at(-1)?.name, "experimental_get_bars");
        assert.equal(tool.annotations?.openWorldHint, true);
        assert.equal((tool.inputSchema.properties?.symbol as { maxLength?: number }).maxLength, 128);
        assert.match(tool.description!, /^\[EXPERIMENTAL\]/);
        assert.equal(tool.outputSchema?.type, "object");
        assert.equal(tool.inputSchema.additionalProperties, false);
      }
      // Invalid input must fail locally even when enabled, never touching the network.
      const result = await client.callTool({ name: "experimental_get_bars", arguments: { symbol: "bad" } });
      assert.equal(result.isError, true);
      assert.match(JSON.stringify(result.content), flag === "0" ? /disabled/ : /EXCHANGE:TICKER/);
    } finally { await client.close(); }
  });
}
