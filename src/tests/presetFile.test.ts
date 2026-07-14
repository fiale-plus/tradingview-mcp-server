import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { parseScreenArgs, buildScreenInput } from "../cli/parseArgs.js";
import { loadPresetFile, validatePresetDocument } from "../cli/presetFile.js";
import { PRESETS, PresetsTool } from "../resources/presets.js";

const presetsTool = new PresetsTool();
const valid = {
  schemaVersion: 1,
  name: "Test preset",
  description: "Strict file preset",
  filters: [{ field: "typespecs", operator: "has", value: ["common"] }],
  markets: ["america"],
  sort_by: "market_cap_basic",
  sort_order: "desc",
  limit: 25,
  columns: ["name", "close"],
};

describe("preset file contract", () => {
  it("parses --preset-file and rejects combining sources", () => {
    const { values } = parseScreenArgs(["--preset-file", "preset.json"]);
    assert.strictEqual(values["preset-file"], "preset.json");
    assert.throws(
      () => buildScreenInput({ preset: "quality_stocks", "preset-file": "x" }, presetsTool, validatePresetDocument(valid)),
      /mutually exclusive/
    );
  });

  it("validates and builds a file preset with limit", () => {
    const preset = validatePresetDocument(valid);
    const { input } = buildScreenInput({ "preset-file": "x" }, presetsTool, preset);
    assert.strictEqual(input.filters[0].operator, "has");
    assert.strictEqual(input.limit, 25);
    assert.deepStrictEqual(input.columns, ["name", "close"]);
  });

  it("accepts file-schema equivalents of every built-in preset", () => {
    for (const [name, preset] of Object.entries(PRESETS)) {
      assert.doesNotThrow(
        () => validatePresetDocument({ schemaVersion: 1, ...preset }),
        name
      );
    }
  });

  it("enforces value contracts for all supported operators", () => {
    const validCases: Array<{ operator: string; value?: unknown }> = [
      { operator: "greater", value: 1 },
      { operator: "less", value: "SMA50" },
      { operator: "greater_or_equal", value: 1 },
      { operator: "less_or_equal", value: "SMA200" },
      { operator: "equal", value: true },
      { operator: "not_equal", value: "Real Estate" },
      { operator: "in_range", value: ["NASDAQ", "NYSE"] },
      { operator: "not_in_range", value: [0, 5] },
      { operator: "crosses", value: "SMA50" },
      { operator: "crosses_above", value: "SMA200" },
      { operator: "crosses_below", value: "SMA200" },
      { operator: "match", value: "Tech" },
      { operator: "above_percent", value: ["SMA200", 10] },
      { operator: "below_percent", value: ["SMA50", 5] },
      { operator: "has", value: ["common"] },
      { operator: "has_none_of", value: ["reit"] },
      { operator: "empty" },
      { operator: "not_empty" },
    ];
    for (const filter of validCases) {
      assert.doesNotThrow(
        () => validatePresetDocument({ ...valid, filters: [{ field: "close", ...filter }] }),
        filter.operator
      );
    }

    const invalidCases: Array<{ operator: string; value: unknown }> = [
      { operator: "greater", value: true },
      { operator: "less", value: null },
      { operator: "greater_or_equal", value: [] },
      { operator: "less_or_equal", value: {} },
      { operator: "equal", value: {} },
      { operator: "not_equal", value: false },
      { operator: "in_range", value: [1, "NASDAQ"] },
      { operator: "not_in_range", value: ["NASDAQ", "NYSE"] },
      { operator: "crosses", value: 5 },
      { operator: "crosses_above", value: false },
      { operator: "crosses_below", value: [] },
      { operator: "match", value: true },
      { operator: "above_percent", value: 10 },
      { operator: "below_percent", value: ["SMA50", "5"] },
      { operator: "has", value: "common" },
      { operator: "has_none_of", value: [] },
      { operator: "empty", value: null },
      { operator: "not_empty", value: false },
    ];
    for (const filter of invalidCases) {
      assert.throws(
        () => validatePresetDocument({ ...valid, filters: [{ field: "close", ...filter }] }),
        Error,
        filter.operator
      );
    }
  });

  it("rejects unknown keys, operators, invalid versions, and mixed query types", () => {
    assert.throws(() => validatePresetDocument({ ...valid, surprise: true }), /unknown keys/);
    assert.throws(() => validatePresetDocument({ ...valid, schemaVersion: 2 }), /schemaVersion/);
    assert.throws(
      () => validatePresetDocument({ ...valid, filters: [{ field: "x", operator: "bad", value: 1 }] }),
      /Unknown operator/
    );
    assert.throws(() => validatePresetDocument({ ...valid, filters: [{ field: "x", operator: "constructor", value: 1 }] }), /Unknown operator/);
    assert.throws(() => validatePresetDocument({ ...valid, filters: [{ field: 123, operator: "equal", value: 1 }] }), /non-empty strings/);
    assert.throws(() => validatePresetDocument({ ...valid, filters: [{ field: "x", operator: "in_range", value: [1] }] }), /two finite numbers or a non-empty string array/);
    assert.throws(() => validatePresetDocument({ ...valid, filters: [{ field: "x", operator: "in_range", value: [1, "NASDAQ"] }] }), /two finite numbers or a non-empty string array/);
    assert.doesNotThrow(() => validatePresetDocument({ ...valid, filters: [{ field: "exchange", operator: "in_range", value: ["NASDAQ", "NYSE"] }] }));
    assert.throws(() => validatePresetDocument({ ...valid, filters: [{ field: "x", operator: "crosses", value: 5 }] }), /non-empty string/);
    assert.throws(() => validatePresetDocument({ ...valid, filters: [{ field: "x", operator: "match", value: true }] }), /non-empty string/);
    assert.throws(() => validatePresetDocument({ ...valid, filters: [{ field: "x", operator: "has", value: 1 }] }), /string array/);
    assert.throws(
      () => validatePresetDocument({ ...valid, filters: [{ field: "x", operator: "equal", value: { unsafe: true } }] }),
      /requires a non-empty string, finite number, or boolean/
    );
    assert.throws(() => validatePresetDocument({ ...valid, symbols: ["TVC:SPX"] }), /exactly one/);
  });

  it("loads relative and symlinked files with redacted provenance", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "preset-file-"));
    try {
      fs.writeFileSync(path.join(directory, "preset.json"), JSON.stringify(valid));
      fs.symlinkSync(path.join(directory, "preset.json"), path.join(directory, "link.json"));
      const loaded = loadPresetFile("link.json", directory);
      assert.strictEqual(loaded.provenance.basename, "preset.json");
      assert.match(loaded.provenance.sha256, /^[a-f0-9]{64}$/);
      assert.strictEqual("resolvedPath" in loaded.provenance, false);
      assert.strictEqual(loaded.preset.name, valid.name);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects FIFOs without blocking", { skip: process.platform === "win32" }, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "preset-file-"));
    try {
      const fifo = path.join(directory, "preset.fifo");
      execFileSync("mkfifo", [fifo]);
      const startedAt = Date.now();
      assert.throws(() => loadPresetFile("preset.fifo", directory), /regular file/);
      assert.ok(Date.now() - startedAt < 1000, "FIFO validation should not block");
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects directories, oversized files, and malformed JSON", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "preset-file-"));
    try {
      assert.throws(() => loadPresetFile(".", directory), /regular file/);
      assert.throws(
        () => loadPresetFile("missing.json", directory),
        (error: Error) => error.message === "Unable to load preset file missing.json" && !error.message.includes(directory)
      );
      fs.mkdirSync(path.join(directory, "exceeds-dir"));
      assert.throws(
        () => loadPresetFile("exceeds-dir/missing.json", directory),
        (error: Error) => error.message === "Unable to load preset file missing.json" && !error.message.includes(directory)
      );
      fs.writeFileSync(path.join(directory, "large.json"), " ".repeat(1024 * 1024 + 1));
      assert.throws(() => loadPresetFile("large.json", directory), /exceeds/);
      fs.writeFileSync(path.join(directory, "bad.json"), "{");
      assert.throws(() => loadPresetFile("bad.json", directory), SyntaxError);
      fs.writeFileSync(path.join(directory, "invalid-utf8.json"), Buffer.from([0xc3, 0x28]));
      assert.throws(() => loadPresetFile("invalid-utf8.json", directory), /encoded data was not valid/);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
