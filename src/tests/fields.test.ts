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
});
