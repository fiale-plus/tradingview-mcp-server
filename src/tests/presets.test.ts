import { describe, it } from "node:test";
import assert from "node:assert";
import { PresetsTool, PRESETS } from "../resources/presets.js";

describe("PresetsTool", () => {
  const presetsTool = new PresetsTool();

  it("should list all presets", () => {
    const presets = presetsTool.listPresets();

    assert.ok(Array.isArray(presets), "Should return array");
    assert.ok(presets.length > 0, "Should have presets");

    const preset = presets[0];
    assert.ok(preset.name, "Preset should have name");
    assert.ok(preset.description, "Preset should have description");
  });

  it("should get quality_stocks preset", () => {
    const preset = presetsTool.getPreset("quality_stocks");

    assert.ok(preset, "Should return preset");
    assert.strictEqual(preset.name, "Quality Stocks (Conservative)");
    assert.ok(Array.isArray(preset.filters), "Should have filters");
    assert.ok(preset.filters.length > 0, "Should have at least one filter");
  });

  it("should get value_stocks preset", () => {
    const preset = presetsTool.getPreset("value_stocks");

    assert.ok(preset, "Should return preset");
    assert.strictEqual(preset.name, "Value Stocks");
    assert.ok(preset.filters.length > 0, "Should have filters");
  });

  it("should return null for non-existent preset", () => {
    const preset = presetsTool.getPreset("nonexistent");
    assert.strictEqual(preset, null);
  });

  it("should have valid filter structure in presets", () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      assert.ok(preset.filters, `${key} should have filters`);

      for (const filter of preset.filters) {
        assert.ok(filter.field, `Filter should have field in ${key}`);
        assert.ok(filter.operator, `Filter should have operator in ${key}`);
        assert.ok(
          filter.value !== undefined,
          `Filter should have value in ${key}`
        );
      }
    }
  });

  it("should have quality_stocks preset with correct filters", () => {
    const preset = PRESETS.quality_stocks;

    // Check for key filters
    const roeFilter = preset.filters.find((f) => f.field === "return_on_equity");
    assert.ok(roeFilter, "Should have ROE filter");
    assert.strictEqual(roeFilter.operator, "greater");
    assert.strictEqual(roeFilter.value, 12);

    const rsiFilter = preset.filters.find((f) => f.field === "RSI");
    assert.ok(rsiFilter, "Should have RSI filter");
    assert.strictEqual(rsiFilter.operator, "in_range");
    assert.deepStrictEqual(rsiFilter.value, [45, 65]);
  });

  it("should have markets defined for stock presets", () => {
    const preset = PRESETS.quality_stocks;
    assert.ok(preset.markets, "Should have markets");
    assert.ok(preset.markets.includes("america"), "Should include america market");
  });
});
