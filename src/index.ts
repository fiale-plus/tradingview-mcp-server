#!/usr/bin/env node

/**
 * TradingView MCP Server
 * Unofficial MCP server for TradingView stock screener API
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { TradingViewClient } from "./api/client.js";
import { ScreenTool } from "./tools/screen.js";
import { FieldsTool } from "./tools/fields.js";
import { PresetsTool, PRESETS } from "./resources/presets.js";
import { Cache } from "./utils/cache.js";
import { RateLimiter } from "./utils/rateLimit.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

// Configuration from environment
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || "300");
const RATE_LIMIT_RPM = parseInt(process.env.RATE_LIMIT_RPM || "10");

// Initialize components
const client = new TradingViewClient();
const cache = new Cache(CACHE_TTL);
const rateLimiter = new RateLimiter(RATE_LIMIT_RPM);
const screenTool = new ScreenTool(client, cache, rateLimiter);
const fieldsTool = new FieldsTool();
const presetsTool = new PresetsTool();

// Start cache cleanup
cache.startCleanup();

// Create MCP server
const server = new Server(
  {
    name: "tradingview-mcp-server",
    version: pkg.version,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "screen_stocks",
        description:
          "Screen stocks based on fundamental and technical criteria. Returns stocks matching the specified filters.",
        inputSchema: {
          type: "object",
          properties: {
            filters: {
              type: "array",
              description: "Array of filter conditions to apply",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    description:
                      "Field name to filter (e.g., 'return_on_equity', 'price_earnings_ttm')",
                  },
                  operator: {
                    type: "string",
                    description:
                      "Comparison operator: greater, less, greater_or_equal, less_or_equal, equal, in_range, etc.",
                  },
                  value: {
                    description:
                      "Value to compare against (number, string for field comparison, or array [min, max] for in_range)",
                  },
                },
                required: ["field", "operator", "value"],
              },
            },
            markets: {
              type: "array",
              items: { type: "string" },
              description: "Markets to scan (e.g., ['america', 'japan']). Default: ['america']",
            },
            sort_by: {
              type: "string",
              description: "Field to sort results by. Default: 'market_cap_basic'",
            },
            sort_order: {
              type: "string",
              enum: ["asc", "desc"],
              description: "Sort order. Default: 'desc'",
            },
            limit: {
              type: "number",
              description: "Number of results to return (1-200). Default: 20",
              minimum: 1,
              maximum: 200,
            },
            columns: {
              type: "array",
              items: { type: "string" },
              description: "Optional: specific columns to include in results. If not provided, uses minimal default columns. Presets may define extended column sets.",
            },
          },
          required: ["filters"],
        },
      },
      {
        name: "list_fields",
        description:
          "List available fields for filtering and display. Use this to discover what fields you can filter and sort by.",
        inputSchema: {
          type: "object",
          properties: {
            asset_type: {
              type: "string",
              enum: ["stock", "forex", "crypto"],
              description: "Type of asset. Default: 'stock'",
            },
            category: {
              type: "string",
              enum: ["fundamental", "technical", "performance"],
              description: "Filter fields by category. If omitted, returns all categories",
            },
          },
        },
      },
      {
        name: "get_preset",
        description:
          "Get a pre-configured screening strategy. Returns filter configuration for common screening strategies like quality stocks, value stocks, etc.",
        inputSchema: {
          type: "object",
          properties: {
            preset_name: {
              type: "string",
              description:
                "Name of preset: quality_stocks, value_stocks, dividend_stocks, momentum_stocks, growth_stocks",
            },
          },
          required: ["preset_name"],
        },
      },
      {
        name: "list_presets",
        description: "List all available preset screening strategies",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "screen_forex",
        description:
          "Screen forex pairs based on technical criteria. Returns forex pairs matching the specified filters.",
        inputSchema: {
          type: "object",
          properties: {
            filters: {
              type: "array",
              description: "Array of filter conditions to apply",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    description:
                      "Field name to filter (e.g., 'close', 'volume', 'RSI', 'change')",
                  },
                  operator: {
                    type: "string",
                    description:
                      "Comparison operator: greater, less, greater_or_equal, less_or_equal, equal, in_range, etc.",
                  },
                  value: {
                    description:
                      "Value to compare against (number, string for field comparison, or array [min, max] for in_range)",
                  },
                },
                required: ["field", "operator", "value"],
              },
            },
            sort_by: {
              type: "string",
              description: "Field to sort results by. Default: 'volume'",
            },
            sort_order: {
              type: "string",
              enum: ["asc", "desc"],
              description: "Sort order. Default: 'desc'",
            },
            limit: {
              type: "number",
              description: "Number of results to return (1-200). Default: 20",
              minimum: 1,
              maximum: 200,
            },
          },
          required: ["filters"],
        },
      },
      {
        name: "screen_crypto",
        description:
          "Screen cryptocurrencies based on technical and market criteria. Returns cryptocurrencies matching the specified filters.",
        inputSchema: {
          type: "object",
          properties: {
            filters: {
              type: "array",
              description: "Array of filter conditions to apply",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    description:
                      "Field name to filter (e.g., 'close', 'market_cap_basic', 'volume', 'change')",
                  },
                  operator: {
                    type: "string",
                    description:
                      "Comparison operator: greater, less, greater_or_equal, less_or_equal, equal, in_range, etc.",
                  },
                  value: {
                    description:
                      "Value to compare against (number, string for field comparison, or array [min, max] for in_range)",
                  },
                },
                required: ["field", "operator", "value"],
              },
            },
            sort_by: {
              type: "string",
              description: "Field to sort results by. Default: 'market_cap_basic'",
            },
            sort_order: {
              type: "string",
              enum: ["asc", "desc"],
              description: "Sort order. Default: 'desc'",
            },
            limit: {
              type: "number",
              description: "Number of results to return (1-200). Default: 20",
              minimum: 1,
              maximum: 200,
            },
          },
          required: ["filters"],
        },
      },
      {
        name: "screen_etf",
        description:
          "Screen ETFs (Exchange-Traded Funds) based on performance and technical criteria. Returns ETFs matching the specified filters.",
        inputSchema: {
          type: "object",
          properties: {
            filters: {
              type: "array",
              description: "Array of filter conditions to apply",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    description:
                      "Field name to filter (e.g., 'close', 'volume', 'change', 'Perf.1M')",
                  },
                  operator: {
                    type: "string",
                    description:
                      "Comparison operator: greater, less, greater_or_equal, less_or_equal, equal, in_range, etc.",
                  },
                  value: {
                    description:
                      "Value to compare against (number, string for field comparison, or array [min, max] for in_range)",
                  },
                },
                required: ["field", "operator", "value"],
              },
            },
            markets: {
              type: "array",
              items: { type: "string" },
              description: "Markets to scan (e.g., ['america']). Default: ['america']",
            },
            sort_by: {
              type: "string",
              description: "Field to sort results by. Default: 'market_cap_basic'",
            },
            sort_order: {
              type: "string",
              enum: ["asc", "desc"],
              description: "Sort order. Default: 'desc'",
            },
            limit: {
              type: "number",
              description: "Number of results to return (1-200). Default: 20",
              minimum: 1,
              maximum: 200,
            },
            columns: {
              type: "array",
              items: { type: "string" },
              description: "Optional: specific columns to include in results. If not provided, uses minimal default columns.",
            },
          },
          required: ["filters"],
        },
      },
      {
        name: "lookup_symbols",
        description:
          "Look up specific symbols (stocks, indexes, ETFs) by ticker. Use this for direct symbol lookup including market indexes like TVC:SPX, TVC:DJI, OMXSTO:OMXS30 that cannot be found via screening. Returns comprehensive data including ATH, 52-week highs/lows.",
        inputSchema: {
          type: "object",
          properties: {
            symbols: {
              type: "array",
              items: { type: "string" },
              description: "Array of ticker symbols (e.g., ['TVC:SPX', 'NASDAQ:AAPL', 'OMXSTO:OMXS30']). Maximum 100 symbols.",
            },
            columns: {
              type: "array",
              items: { type: "string" },
              description: "Optional: specific columns to include. Default: name, close, change, volume, market_cap_basic, all_time_high, all_time_low, price_52_week_high, price_52_week_low.",
            },
          },
          required: ["symbols"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "screen_stocks": {
        const result = await screenTool.screenStocks(args as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_fields": {
        const result = fieldsTool.listFields(args as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_preset": {
        const preset = presetsTool.getPreset((args as any).preset_name);
        if (!preset) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: "Preset not found" }, null, 2),
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(preset, null, 2),
            },
          ],
        };
      }

      case "list_presets": {
        const presets = presetsTool.listPresets();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(presets, null, 2),
            },
          ],
        };
      }

      case "screen_forex": {
        const result = await screenTool.screenForex(args as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "screen_crypto": {
        const result = await screenTool.screenCrypto(args as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "screen_etf": {
        const result = await screenTool.screenETF(args as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "lookup_symbols": {
        const result = await screenTool.lookupSymbols(args as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: `Unknown tool: ${name}` }),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: error instanceof Error ? error.message : String(error),
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// List resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Object.keys(PRESETS).map((key) => ({
      uri: `preset://${key}`,
      name: PRESETS[key].name,
      description: PRESETS[key].description,
      mimeType: "application/json",
    })),
  };
});

// Read resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (!uri.startsWith("preset://")) {
    throw new Error("Invalid resource URI");
  }

  const presetName = uri.replace("preset://", "");
  const preset = PRESETS[presetName];

  if (!preset) {
    throw new Error(`Preset not found: ${presetName}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(preset, null, 2),
      },
    ],
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("TradingView MCP Server running on stdio");
  console.error(`Cache TTL: ${CACHE_TTL}s | Rate Limit: ${RATE_LIMIT_RPM} req/min`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
