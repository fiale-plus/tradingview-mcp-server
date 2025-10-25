import { describe, it } from "node:test";
import assert from "node:assert";
import { FieldsTool } from "../tools/fields.js";

describe("FieldsTool", () => {
  const fieldsTool = new FieldsTool();

  it("should list all stock fields", () => {
    const result = fieldsTool.listFields({ asset_type: "stock" });

    assert.strictEqual(result.asset_type, "stock");
    assert.strictEqual(result.category, "all");
    assert.ok(result.field_count > 0, "Should have fields");
    assert.ok(Array.isArray(result.fields), "Fields should be an array");
  });

  it("should filter by category", () => {
    const result = fieldsTool.listFields({
      asset_type: "stock",
      category: "fundamental",
    });

    assert.strictEqual(result.category, "fundamental");
    assert.ok(result.fields.length > 0, "Should have fundamental fields");

    // All fields should be fundamental
    const allFundamental = result.fields.every(
      (f: any) => f.category === "fundamental"
    );
    assert.ok(allFundamental, "All fields should be fundamental");
  });

  it("should filter technical fields", () => {
    const result = fieldsTool.listFields({
      asset_type: "stock",
      category: "technical",
    });

    assert.strictEqual(result.category, "technical");

    const allTechnical = result.fields.every(
      (f: any) => f.category === "technical"
    );
    assert.ok(allTechnical, "All fields should be technical");
  });

  it("should filter performance fields", () => {
    const result = fieldsTool.listFields({
      asset_type: "stock",
      category: "performance",
    });

    assert.strictEqual(result.category, "performance");

    const allPerformance = result.fields.every(
      (f: any) => f.category === "performance"
    );
    assert.ok(allPerformance, "All fields should be performance");
  });

  it("should return message for unsupported asset types", () => {
    const result = fieldsTool.listFields({ asset_type: "forex" });

    assert.ok(result.message, "Should have message");
    assert.strictEqual(result.fields.length, 0, "Should have no fields");
  });

  it("should include field metadata", () => {
    const result = fieldsTool.listFields({ asset_type: "stock" });

    const sampleField = result.fields[0];
    assert.ok(sampleField.name, "Field should have name");
    assert.ok(sampleField.label, "Field should have label");
    assert.ok(sampleField.category, "Field should have category");
    assert.ok(sampleField.type, "Field should have type");
  });

  it("should include field variants (TTM, FQ, FY)", () => {
    const result = fieldsTool.listFields({ asset_type: "stock" });
    const fieldNames = result.fields.map((f: any) => f.name);

    // Check for return_on_equity variants
    assert.ok(
      fieldNames.includes("return_on_equity"),
      "Should have return_on_equity (TTM)"
    );
    assert.ok(
      fieldNames.includes("return_on_equity_fq"),
      "Should have return_on_equity_fq (FQ)"
    );

    // Check for debt_to_equity variants
    assert.ok(
      fieldNames.includes("debt_to_equity"),
      "Should have debt_to_equity"
    );
    assert.ok(
      fieldNames.includes("debt_to_equity_fy"),
      "Should have debt_to_equity_fy (FY)"
    );

    // Check for net_margin variants
    assert.ok(
      fieldNames.includes("net_margin_ttm"),
      "Should have net_margin_ttm"
    );
    assert.ok(fieldNames.includes("net_margin_fy"), "Should have net_margin_fy");

    // Check for price_sales variants
    assert.ok(
      fieldNames.includes("price_sales_ratio"),
      "Should have price_sales_ratio"
    );
    assert.ok(
      fieldNames.includes("price_sales_current"),
      "Should have price_sales_current"
    );
  });

  it("should include new fundamental fields", () => {
    const result = fieldsTool.listFields({
      asset_type: "stock",
      category: "fundamental",
    });
    const fieldNames = result.fields.map((f: any) => f.name);

    assert.ok(
      fieldNames.includes("revenue_per_share_ttm"),
      "Should have revenue_per_share_ttm"
    );
    assert.ok(
      fieldNames.includes("total_revenue_yoy_growth_ttm"),
      "Should have total_revenue_yoy_growth_ttm"
    );
  });

  it("should include new performance fields", () => {
    const result = fieldsTool.listFields({
      asset_type: "stock",
      category: "performance",
    });
    const fieldNames = result.fields.map((f: any) => f.name);

    assert.ok(
      fieldNames.includes("average_volume_90d_calc"),
      "Should have average_volume_90d_calc"
    );
    assert.ok(fieldNames.includes("exchange"), "Should have exchange field");
    assert.ok(
      fieldNames.includes("is_primary"),
      "Should have is_primary field"
    );
  });

  it("should have correct metadata for exchange field", () => {
    const result = fieldsTool.listFields({ asset_type: "stock" });
    const exchangeField = result.fields.find((f: any) => f.name === "exchange");

    assert.ok(exchangeField, "Exchange field should exist");
    assert.strictEqual(exchangeField.type, "string", "Exchange should be string type");
    assert.ok(
      exchangeField.description.includes("NASDAQ"),
      "Description should mention NASDAQ"
    );
  });

  it("should have correct metadata for is_primary field", () => {
    const result = fieldsTool.listFields({ asset_type: "stock" });
    const isPrimaryField = result.fields.find(
      (f: any) => f.name === "is_primary"
    );

    assert.ok(isPrimaryField, "is_primary field should exist");
    assert.strictEqual(isPrimaryField.type, "string", "is_primary should be string type");
    assert.ok(
      isPrimaryField.description.includes("primary"),
      "Description should mention primary"
    );
  });
});
