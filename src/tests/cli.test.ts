import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
import {
  parseTopLevel,
  parseScreenArgs,
  parseLookupArgs,
  parseFieldsArgs,
  parseMetainfoArgs,
  parsePresetArgs,
  parseTAArgs,
  buildScreenInput,
  buildLookupInput,
  buildFieldsInput,
  buildMetainfoInput,
  buildTAInput,
  buildRankTAInput,
} from "../cli/parseArgs.js";
import {
  formatOutput,
  extractItems,
  type OutputFormat,
} from "../cli/formatters.js";
import { PresetsTool } from "../resources/presets.js";

const presetsTool = new PresetsTool();

describe("CLI - Argument Parsing", () => {
  describe("Top-level parsing", () => {
    it("should parse --help flag", () => {
      const { values } = parseTopLevel(["--help"]);
      assert.strictEqual(values.help, true);
    });

    it("should parse -v flag", () => {
      const { values } = parseTopLevel(["-v"]);
      assert.strictEqual(values.version, true);
    });

    it("should extract command as first positional", () => {
      const { positionals } = parseTopLevel(["screen", "stocks", "--limit", "10"]);
      assert.strictEqual(positionals[0], "screen");
      assert.strictEqual(positionals[1], "stocks");
    });

    it("should parse with no args", () => {
      const { positionals, values } = parseTopLevel([]);
      assert.strictEqual(positionals.length, 0);
      assert.strictEqual(values.help, undefined);
    });
  });

  describe("Screen args parsing", () => {
    it("should parse --limit", () => {
      const { values } = parseScreenArgs(["--limit", "10"]);
      assert.strictEqual(values.limit, "10");
    });

    it("should parse --preset", () => {
      const { values } = parseScreenArgs(["--preset", "quality_stocks"]);
      assert.strictEqual(values.preset, "quality_stocks");
    });

    it("should parse --sort-by and --sort-order", () => {
      const { values } = parseScreenArgs(["--sort-by", "RSI", "--sort-order", "asc"]);
      assert.strictEqual(values["sort-by"], "RSI");
      assert.strictEqual(values["sort-order"], "asc");
    });

    it("should parse multiple --markets", () => {
      const { values } = parseScreenArgs(["--markets", "america", "--markets", "uk"]);
      assert.deepStrictEqual(values.markets, ["america", "uk"]);
    });

    it("should parse multiple --columns", () => {
      const { values } = parseScreenArgs(["--columns", "close", "volume"]);
      assert.deepStrictEqual(values.columns, ["close", "volume"]);
    });

    it("should parse --format with short flag -f", () => {
      const { values } = parseScreenArgs(["-f", "csv"]);
      assert.strictEqual(values.format, "csv");
    });

    it("should parse --filters as JSON string", () => {
      const json = '[{"field":"RSI","operator":"less","value":70}]';
      const { values } = parseScreenArgs(["--filters", json]);
      assert.strictEqual(values.filters, json);
    });
  });

  describe("Lookup args parsing", () => {
    it("should parse symbols as positionals", () => {
      const { positionals } = parseLookupArgs(["NASDAQ:AAPL", "TVC:SPX"]);
      assert.deepStrictEqual(positionals, ["NASDAQ:AAPL", "TVC:SPX"]);
    });

    it("should parse --columns with symbols", () => {
      const { positionals, values } = parseLookupArgs([
        "NASDAQ:AAPL",
        "--columns",
        "close",
        "change",
        "volume",
      ]);
      assert.deepStrictEqual(positionals, ["NASDAQ:AAPL"]);
      assert.deepStrictEqual(values.columns, ["close", "change", "volume"]);
    });
  });

  describe("Fields args parsing", () => {
    it("should parse --asset-type and --category", () => {
      const { values } = parseFieldsArgs(["--asset-type", "forex", "--category", "technical"]);
      assert.strictEqual(values["asset-type"], "forex");
      assert.strictEqual(values.category, "technical");
    });
  });

  describe("Metainfo args parsing", () => {
    it("should parse space-separated --fields values", () => {
      const { positionals, values } = parseMetainfoArgs([
        "america",
        "--fields",
        "name",
        "close",
        "volume",
      ]);
      assert.deepStrictEqual(positionals, ["america"]);
      assert.deepStrictEqual(values.fields, ["name", "close", "volume"]);
    });
  });

  describe("TA args parsing", () => {
    it("should parse space-separated --timeframes values", () => {
      const { positionals, values } = parseTAArgs([
        "NASDAQ:AAPL",
        "--timeframes",
        "60",
        "240",
        "1D",
        "1W",
      ]);
      assert.deepStrictEqual(positionals, ["NASDAQ:AAPL"]);
      assert.deepStrictEqual(values.timeframes, ["60", "240", "1D", "1W"]);
    });
  });

  describe("Preset args parsing", () => {
    it("should parse preset name as positional", () => {
      const { positionals } = parsePresetArgs(["quality_stocks"]);
      assert.deepStrictEqual(positionals, ["quality_stocks"]);
    });

    it("should parse --format flag", () => {
      const { values } = parsePresetArgs(["quality_stocks", "-f", "table"]);
      assert.strictEqual(values.format, "table");
    });
  });
});

describe("CLI - Input Builders", () => {
  describe("buildScreenInput", () => {
    it("should build input from --filters only", () => {
      const filters = '[{"field":"RSI","operator":"less","value":70}]';
      const { input, isSymbolLookup } = buildScreenInput(
        { filters },
        presetsTool
      );
      assert.strictEqual(isSymbolLookup, false);
      assert.strictEqual(input.filters.length, 1);
      assert.strictEqual(input.filters[0].field, "RSI");
    });

    it("should build input from --preset", () => {
      const { input, isSymbolLookup } = buildScreenInput(
        { preset: "quality_stocks" },
        presetsTool
      );
      assert.strictEqual(isSymbolLookup, false);
      assert.ok(input.filters.length > 0);
      assert.deepStrictEqual(input.markets, ["america"]);
    });

    it("should merge preset filters with --filters", () => {
      const extra = '[{"field":"RSI","operator":"less","value":50}]';
      const { input } = buildScreenInput(
        { preset: "quality_stocks", filters: extra },
        presetsTool
      );
      // Preset has 9 filters, we added 1
      const preset = presetsTool.getPreset("quality_stocks")!;
      assert.strictEqual(input.filters.length, preset.filters!.length + 1);
      assert.strictEqual(input.filters[input.filters.length - 1].field, "RSI");
      assert.strictEqual(input.filters[input.filters.length - 1].value, 50);
    });

    it("should let CLI flags override preset values", () => {
      const { input } = buildScreenInput(
        { preset: "quality_stocks", "sort-by": "RSI", limit: "5" },
        presetsTool
      );
      assert.strictEqual(input.sort_by, "RSI");
      assert.strictEqual(input.limit, 5);
    });

    it("should detect symbol-based presets", () => {
      const { isSymbolLookup, symbols } = buildScreenInput(
        { preset: "market_indexes" },
        presetsTool
      );
      assert.strictEqual(isSymbolLookup, true);
      assert.ok(symbols && symbols.length > 0);
    });

    it("should throw for unknown preset", () => {
      assert.throws(
        () => buildScreenInput({ preset: "nonexistent" }, presetsTool),
        { message: /Unknown preset: nonexistent/ }
      );
    });

    it("should build input with no filters when none provided", () => {
      const { input } = buildScreenInput({}, presetsTool);
      assert.deepStrictEqual(input.filters, []);
    });

    it("should override preset markets with CLI --markets", () => {
      const { input } = buildScreenInput(
        { preset: "quality_stocks", markets: ["uk"] },
        presetsTool
      );
      assert.deepStrictEqual(input.markets, ["uk"]);
    });

    it("should use CLI columns when explicitly provided", () => {
      const { input } = buildScreenInput(
        { preset: "quality_stocks", columns: ["close", "volume"] },
        presetsTool
      );
      assert.deepStrictEqual(input.columns, ["close", "volume"]);
    });

    it("should use preset columns when CLI columns not provided", () => {
      const { input } = buildScreenInput(
        { preset: "quality_growth_screener" },
        presetsTool
      );
      // quality_growth_screener has custom columns defined
      const preset = presetsTool.getPreset("quality_growth_screener")!;
      assert.deepStrictEqual(input.columns, preset.columns);
    });

    it("should override preset sort-order with CLI flag", () => {
      const { input } = buildScreenInput(
        { preset: "quality_stocks", "sort-order": "asc" },
        presetsTool
      );
      assert.strictEqual(input.sort_order, "asc");
    });
  });

  describe("buildLookupInput", () => {
    it("should build from positional symbols", () => {
      const result = buildLookupInput(["NASDAQ:AAPL", "TVC:SPX"], {});
      assert.deepStrictEqual(result.symbols, ["NASDAQ:AAPL", "TVC:SPX"]);
    });

    it("should include columns when provided", () => {
      const result = buildLookupInput(["NASDAQ:AAPL"], {
        columns: ["close", "change"],
      });
      assert.deepStrictEqual(result.columns, ["close", "change"]);
    });

    it("should throw when no symbols provided", () => {
      assert.throws(() => buildLookupInput([], {}), {
        message: /No symbols provided/,
      });
    });
  });

  describe("buildFieldsInput", () => {
    it("should map --asset-type and --category", () => {
      const result = buildFieldsInput({
        "asset-type": "forex",
        category: "technical",
      });
      assert.strictEqual(result.asset_type, "forex");
      assert.strictEqual(result.category, "technical");
    });

    it("should handle missing options", () => {
      const result = buildFieldsInput({});
      assert.strictEqual(result.asset_type, undefined);
      assert.strictEqual(result.category, undefined);
    });
  });

  describe("buildMetainfoInput", () => {
    it("should split comma-separated --fields values", () => {
      const result = buildMetainfoInput(
        ["america"],
        { fields: ["name,close,market_cap_basic"] }
      );
      assert.deepStrictEqual(result.fields, ["name", "close", "market_cap_basic"]);
    });
  });

  describe("buildTAInput", () => {
    it("should split comma-separated timeframes", () => {
      const result = buildTAInput(
        ["NASDAQ:AAPL"],
        { timeframes: ["60,1D"] }
      );
      assert.deepStrictEqual(result.timeframes, ["60", "1D"]);
    });
  });

  describe("buildRankTAInput", () => {
    it("should split comma-separated timeframes", () => {
      const result = buildRankTAInput(
        ["NASDAQ:AAPL", "NASDAQ:MSFT"],
        { timeframes: ["60,240,1D"] }
      );
      assert.deepStrictEqual(result.timeframes, ["60", "240", "1D"]);
    });
  });
});

describe("CLI - Formatters", () => {
  describe("extractItems", () => {
    it("should extract stocks array", () => {
      const data = { total_count: 2, stocks: [{ a: 1 }, { a: 2 }] };
      assert.deepStrictEqual(extractItems(data), [{ a: 1 }, { a: 2 }]);
    });

    it("should extract fields array", () => {
      const data = {
        asset_type: "stock",
        field_count: 1,
        fields: [{ name: "RSI" }],
      };
      assert.deepStrictEqual(extractItems(data), [{ name: "RSI" }]);
    });

    it("should handle raw array input", () => {
      const data = [{ key: "a" }, { key: "b" }];
      assert.deepStrictEqual(extractItems(data), data);
    });

    it("should wrap non-array, non-object in array", () => {
      const items = extractItems("hello");
      assert.deepStrictEqual(items, ["hello"]);
    });

    it("should handle object with no array values", () => {
      const data = { name: "test", value: 42 };
      assert.deepStrictEqual(extractItems(data), [data]);
    });
  });

  describe("formatOutput - JSON", () => {
    it("should produce pretty-printed JSON", () => {
      const data = { total_count: 1, stocks: [{ ticker: "AAPL" }] };
      const output = formatOutput(data, "json");
      assert.strictEqual(output, JSON.stringify(data, null, 2));
    });
  });

  describe("formatOutput - CSV", () => {
    it("should produce headers and rows", () => {
      const data = {
        total_count: 2,
        stocks: [
          { ticker: "AAPL", price: 150 },
          { ticker: "MSFT", price: 300 },
        ],
      };
      const output = formatOutput(data, "csv");
      const lines = output.split("\n");
      assert.strictEqual(lines[0], "ticker,price");
      assert.strictEqual(lines[1], "AAPL,150");
      assert.strictEqual(lines[2], "MSFT,300");
    });

    it("should handle null values", () => {
      const data = { stocks: [{ ticker: "AAPL", pe: null }] };
      const output = formatOutput(data, "csv");
      const lines = output.split("\n");
      assert.strictEqual(lines[1], "AAPL,");
    });

    it("should escape values containing commas", () => {
      const data = { items: [{ name: "Apple, Inc.", price: 150 }] };
      const output = formatOutput(data, "csv");
      const lines = output.split("\n");
      assert.strictEqual(lines[1], '"Apple, Inc.",150');
    });

    it("should escape values containing quotes", () => {
      const data = { items: [{ name: 'Say "hello"', price: 1 }] };
      const output = formatOutput(data, "csv");
      const lines = output.split("\n");
      assert.strictEqual(lines[1], '"Say ""hello""",1');
    });

    it("should return empty string for no results", () => {
      const data = { stocks: [] };
      assert.strictEqual(formatOutput(data, "csv"), "");
    });
  });

  describe("formatOutput - Table", () => {
    it("should produce aligned columns", () => {
      const data = {
        stocks: [
          { ticker: "AAPL", price: 150 },
          { ticker: "MSFT", price: 300 },
        ],
      };
      const output = formatOutput(data, "table");
      const lines = output.split("\n");
      // Header line
      assert.ok(lines[0].includes("ticker"));
      assert.ok(lines[0].includes("price"));
      // Separator line
      assert.ok(lines[1].includes("---"));
      // Data rows
      assert.ok(lines[2].includes("AAPL"));
      assert.ok(lines[3].includes("MSFT"));
    });

    it("should return '(no results)' for empty data", () => {
      const data = { stocks: [] };
      assert.strictEqual(formatOutput(data, "table"), "(no results)");
    });

    it("should handle null values in table", () => {
      const data = { stocks: [{ ticker: "AAPL", pe: null }] };
      const output = formatOutput(data, "table");
      assert.ok(output.includes("AAPL"));
    });
  });

  describe("formatOutput - default", () => {
    it("should default to JSON when format is undefined", () => {
      const data = { x: 1 };
      assert.strictEqual(
        formatOutput(data, undefined as unknown as OutputFormat),
        JSON.stringify(data, null, 2)
      );
    });
  });
});

describe("CLI - Integration", () => {
  it("should use preset columns for symbol-based lookup", () => {
    const { isSymbolLookup, symbols, input } = buildScreenInput(
      { preset: "macro_assets" },
      presetsTool
    );
    assert.strictEqual(isSymbolLookup, true);
    assert.ok(symbols!.length > 0);
    // macro_assets preset has custom columns
    const preset = presetsTool.getPreset("macro_assets")!;
    assert.deepStrictEqual(input.columns, preset.columns);
  });

  it("should handle all format types for preset list", () => {
    const result = presetsTool.listPresets();
    for (const fmt of ["json", "csv", "table"] as OutputFormat[]) {
      const output = formatOutput(result, fmt);
      assert.ok(output.length > 0, `${fmt} format produced empty output`);
    }
  });

  it("should handle all format types for fields list", async () => {
    const { FieldsTool } = await import("../tools/fields.js");
    const fieldsTool = new FieldsTool();
    const result = fieldsTool.listFields({ asset_type: "stock" });
    for (const fmt of ["json", "csv", "table"] as OutputFormat[]) {
      const output = formatOutput(result, fmt);
      assert.ok(output.length > 0, `${fmt} format produced empty output`);
    }
  });

  it("should throw on malformed JSON in --filters", () => {
    assert.throws(
      () => buildScreenInput({ filters: "not valid json" }, presetsTool),
      { name: "SyntaxError" }
    );
  });

  it("should handle preset with filters and custom columns together", () => {
    // quality_growth_screener has both filters and columns
    const extra = '[{"field":"volume","operator":"greater","value":100000}]';
    const { input, isSymbolLookup } = buildScreenInput(
      { preset: "quality_growth_screener", filters: extra },
      presetsTool
    );
    assert.strictEqual(isSymbolLookup, false);
    const preset = presetsTool.getPreset("quality_growth_screener")!;
    assert.strictEqual(input.filters.length, preset.filters!.length + 1);
    assert.deepStrictEqual(input.columns, preset.columns);
  });

  it("should format all result shapes in CSV", () => {
    const shapes = [
      { total_count: 1, pairs: [{ pair: "EURUSD", rate: 1.08 }] },
      { total_count: 1, cryptocurrencies: [{ coin: "BTC", price: 60000 }] },
      { total_count: 1, etfs: [{ ticker: "SPY", nav: 500 }] },
      { total_count: 1, symbols: [{ symbol: "TVC:SPX", close: 5000 }] },
    ];
    for (const shape of shapes) {
      const csv = formatOutput(shape, "csv");
      const lines = csv.split("\n");
      assert.strictEqual(lines.length, 2, `Expected header + 1 row for ${JSON.stringify(shape)}`);
    }
  });

  it("should format all result shapes in table", () => {
    const shapes = [
      { total_count: 1, pairs: [{ pair: "EURUSD", rate: 1.08 }] },
      { total_count: 1, cryptocurrencies: [{ coin: "BTC", price: 60000 }] },
      { total_count: 1, etfs: [{ ticker: "SPY", nav: 500 }] },
    ];
    for (const shape of shapes) {
      const table = formatOutput(shape, "table");
      const lines = table.split("\n");
      assert.ok(lines.length >= 3, "Table should have header, separator, and data row");
    }
  });

  it("should handle empty filters array in buildScreenInput", () => {
    const { input } = buildScreenInput({ filters: "[]" }, presetsTool);
    assert.deepStrictEqual(input.filters, []);
  });
});

describe("CLI - End-to-End (child process)", () => {
  const cli = (args: string[]) =>
    execFileAsync("npx", ["tsx", "src/cli.ts", ...args], {
      timeout: 10000,
    });

  it("should show help with --help", async () => {
    const { stdout } = await cli(["--help"]);
    assert.ok(stdout.includes("Usage: tradingview-cli"));
    assert.ok(stdout.includes("screen stocks"));
    assert.ok(!stdout.includes("experimental bars"));
  });

  it("should show help with no args", async () => {
    const { stdout } = await cli([]);
    assert.ok(stdout.includes("Usage: tradingview-cli"));
  });

  it("should show version with --version", async () => {
    const { stdout } = await cli(["--version"]);
    assert.ok(stdout.startsWith("tradingview-cli v"));
  });

  it("should list presets as JSON", async () => {
    const { stdout } = await cli(["presets"]);
    const result = JSON.parse(stdout);
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
    assert.ok(result[0].key);
    assert.ok(result[0].name);
  });

  it("should list presets as CSV", async () => {
    const { stdout } = await cli(["presets", "-f", "csv"]);
    const lines = stdout.trim().split("\n");
    assert.ok(lines[0].includes("key"));
    assert.ok(lines.length > 5);
  });

  it("should list presets as table", async () => {
    const { stdout } = await cli(["presets", "-f", "table"]);
    assert.ok(stdout.includes("---"));
    assert.ok(stdout.includes("quality_stocks"));
  });

  it("should get a specific preset", async () => {
    const { stdout } = await cli(["preset", "value_stocks"]);
    const result = JSON.parse(stdout);
    assert.strictEqual(result.name, "Value Stocks");
    assert.ok(result.filters.length > 0);
  });

  it("should list fields for stock fundamental", async () => {
    const { stdout } = await cli([
      "fields",
      "--asset-type",
      "stock",
      "--category",
      "fundamental",
    ]);
    const result = JSON.parse(stdout);
    assert.strictEqual(result.asset_type, "stock");
    assert.strictEqual(result.category, "fundamental");
    assert.ok(result.fields.length > 0);
  });

  it("should list fields for crypto", async () => {
    const { stdout } = await cli(["fields", "--asset-type", "crypto"]);
    const result = JSON.parse(stdout);
    assert.strictEqual(result.asset_type, "crypto");
    assert.ok(result.fields.length > 0);
  });

  it("should show screen help", async () => {
    const { stdout } = await cli(["screen", "stocks", "--help"]);
    assert.ok(stdout.includes("--filters"));
    assert.ok(stdout.includes("--preset"));
  });

  it("should reject unknown command", async () => {
    await assert.rejects(
      () => cli(["foobar"]),
      (err: any) => {
        assert.ok(err.stderr.includes("Unknown command: foobar"));
        return true;
      }
    );
  });

  it("should reject screen with invalid asset type", async () => {
    await assert.rejects(
      () => cli(["screen", "bonds"]),
      (err: any) => {
        assert.ok(err.stderr.includes("invalid asset type"));
        return true;
      }
    );
  });

  it("should reject preset with missing name", async () => {
    await assert.rejects(
      () => cli(["preset"]),
      (err: any) => {
        assert.ok(err.stderr.includes("Missing preset name"));
        return true;
      }
    );
  });

  it("should reject unknown preset name", async () => {
    await assert.rejects(
      () => cli(["preset", "nonexistent"]),
      (err: any) => {
        assert.ok(err.stderr.includes("Unknown preset: nonexistent"));
        return true;
      }
    );
  });

  it("should reject lookup with no symbols", async () => {
    await assert.rejects(
      () => cli(["lookup"]),
      (err: any) => {
        assert.ok(err.stderr.includes("No symbols provided"));
        return true;
      }
    );
  });
});
