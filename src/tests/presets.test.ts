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
    assert.ok(preset.filters && preset.filters.length > 0, "Should have filters");
  });

  it("should return null for non-existent preset", () => {
    const preset = presetsTool.getPreset("nonexistent");
    assert.strictEqual(preset, null);
  });

  it("should have valid filter structure in presets", () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      // Skip symbol-based presets (like market_indexes)
      if (preset.symbols) {
        assert.ok(preset.symbols.length > 0, `${key} should have symbols`);
        continue;
      }

      assert.ok(preset.filters, `${key} should have filters`);

      for (const filter of preset.filters!) {
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

    assert.ok(preset.filters, "Should have filters");

    // Check for key filters
    const roeFilter = preset.filters!.find((f) => f.field === "return_on_equity");
    assert.ok(roeFilter, "Should have ROE filter");
    assert.strictEqual(roeFilter.operator, "greater");
    assert.strictEqual(roeFilter.value, 12);

    const rsiFilter = preset.filters!.find((f) => f.field === "RSI");
    assert.ok(rsiFilter, "Should have RSI filter");
    assert.strictEqual(rsiFilter.operator, "in_range");
    assert.deepStrictEqual(rsiFilter.value, [45, 65]);
  });

  it("should have markets defined for stock presets", () => {
    const preset = PRESETS.quality_stocks;
    assert.ok(preset.markets, "Should have markets");
    assert.ok(preset.markets.includes("america"), "Should include america market");
  });

  it("should have quality_growth_screener preset with all required filters", () => {
    const preset = PRESETS.quality_growth_screener;

    assert.ok(preset, "Should have quality_growth_screener preset");
    assert.strictEqual(preset.name, "Quality Growth Screener");
    assert.ok(preset.filters, "Should have filters");
    assert.strictEqual(preset.filters!.length, 16, "Should have 16 filters");

    // Verify key fundamental filters
    const roeFilter = preset.filters!.find((f) => f.field === "return_on_equity_fq");
    assert.ok(roeFilter, "Should have ROE (FQ) filter");
    assert.strictEqual(roeFilter.operator, "greater");
    assert.strictEqual(roeFilter.value, 15);

    const marginFilter = preset.filters!.find((f) => f.field === "net_margin_fy");
    assert.ok(marginFilter, "Should have net margin (FY) filter");
    assert.strictEqual(marginFilter.value, 12);

    const debtFilter = preset.filters!.find((f) => f.field === "debt_to_equity_fy");
    assert.ok(debtFilter, "Should have debt/equity (FY) filter");
    assert.strictEqual(debtFilter.operator, "less");
    assert.strictEqual(debtFilter.value, 0.6);

    // Verify growth filter
    const revenueGrowthFilter = preset.filters!.find(
      (f) => f.field === "total_revenue_yoy_growth_ttm"
    );
    assert.ok(revenueGrowthFilter, "Should have revenue growth filter");
    assert.strictEqual(revenueGrowthFilter.value, 8);

    // Verify technical filters
    const rsiFilter = preset.filters!.find((f) => f.field === "RSI");
    assert.ok(rsiFilter, "Should have RSI filter");
    assert.strictEqual(rsiFilter.operator, "in_range");
    assert.deepStrictEqual(rsiFilter.value, [45, 62]);

    // Verify exchange filtering with string array
    const exchangeFilter = preset.filters!.find((f) => f.field === "exchange");
    assert.ok(exchangeFilter, "Should have exchange filter");
    assert.strictEqual(exchangeFilter.operator, "in_range");
    assert.deepStrictEqual(
      exchangeFilter.value,
      ["NASDAQ", "NYSE", "CBOE"],
      "Should filter for major US exchanges"
    );

    // Verify is_primary boolean filter
    const isPrimaryFilter = preset.filters!.find((f) => f.field === "is_primary");
    assert.ok(isPrimaryFilter, "Should have is_primary filter");
    assert.strictEqual(isPrimaryFilter.operator, "equal");
    assert.strictEqual(isPrimaryFilter.value, true, "Should filter for primary listings");
  });

  it("should have quality_growth_screener with extended columns", () => {
    const preset = PRESETS.quality_growth_screener;

    assert.ok(preset.columns, "Should have columns property");
    assert.ok(Array.isArray(preset.columns), "Columns should be an array");
    assert.ok(
      preset.columns.length > 7,
      "Should have more columns than minimal default (7)"
    );

    // Verify extended columns are present
    const extendedFields = [
      "free_cash_flow_ttm",
      "sector",
      "industry",
      "beta_5_year",
      "dividends_yield_current",
    ];

    for (const field of extendedFields) {
      assert.ok(
        preset.columns.includes(field),
        `Should include extended field: ${field}`
      );
    }
  });

  it("should have quality_growth_screener with correct sorting", () => {
    const preset = PRESETS.quality_growth_screener;

    assert.strictEqual(preset.sort_by, "market_cap_basic");
    assert.strictEqual(preset.sort_order, "desc");
  });
});
