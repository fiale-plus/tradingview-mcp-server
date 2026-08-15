import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function withMcpClient<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx/esm", "src/index.ts"],
    cwd: PROJECT_ROOT,
    stderr: "pipe",
  });
  const client = new Client({ name: "contract-test", version: "1.0.0" });
  await client.connect(transport);
  try {
    return await run(client);

  } finally {
    await client.close();
  }
}
function textFromResult(result: unknown): string {
  if (typeof result !== "object" || result === null || !("content" in result)) {
    throw new Error("MCP result does not contain content");
  }
  const content = result.content;
  if (!Array.isArray(content)) throw new Error("MCP result content is not an array");
  const first = content[0];
  if (
    typeof first !== "object" ||
    first === null ||
    !("text" in first) ||
    typeof first.text !== "string"
  ) {
    throw new Error("MCP result does not contain text content");
  }
  return first.text;
}

function recordFromResult(result: unknown): Record<string, unknown> {
  if (
    typeof result !== "object" ||
    result === null ||
    !("structuredContent" in result) ||
    typeof result.structuredContent !== "object" ||
    result.structuredContent === null ||
    Array.isArray(result.structuredContent)
  ) {
    throw new Error("MCP result does not contain structured content");
  }
  return result.structuredContent as Record<string, unknown>;
}

describe("MCP wire contracts", () => {
  it("publishes output schemas for every public tool", async () => {
    await withMcpClient(async (client) => {
      const result = await client.listTools();
      const expectedTools = [
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

      assert.deepEqual(
        result.tools.map((tool) => tool.name).sort(),
        expectedTools.sort()
      );
      for (const tool of result.tools) {
        assert.equal(tool.outputSchema?.type, "object", tool.name);
      }
    });
  });

  it("validates malformed filters before touching the upstream API", async () => {
    await withMcpClient(async (client) => {
      const result = await client.callTool({
        name: "screen_stocks",
        arguments: {
          filters: [{ field: "close", operator: "above_percent", value: 5 }],
        },
      });
      assert.equal(result.isError, true);
      const text = textFromResult(result);
      assert.match(text, /above_percent requires \[field, finite percent\]/);
    });
  });

  it("handles omitted optional arguments and preserves list-presets text output", async () => {
    await withMcpClient(async (client) => {
      const result = await client.callTool({ name: "list_presets", arguments: {} });
      assert.equal(result.isError, undefined);
      const structured = recordFromResult(result);
      assert.ok(Array.isArray(structured.presets));
      const text = textFromResult(result);
      assert.ok(Array.isArray(JSON.parse(text)));

      const fieldsResult = await client.callTool({ name: "list_fields" });
      assert.equal(fieldsResult.isError, undefined);
      const fields = recordFromResult(fieldsResult);
      assert.ok(Array.isArray(fields.fields));
    });
  });
});
