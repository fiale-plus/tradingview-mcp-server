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
    assert.strictEqual(isPrimaryField.type, "boolean", "is_primary should be boolean type");
    assert.ok(
      isPrimaryField.description.includes("primary"),
      "Description should mention primary"
    );
  });

  describe("19 New Comprehensive Fields", () => {
    // Helper to get all field names
    const getAllFieldNames = () => {
      const result = fieldsTool.listFields({ asset_type: "stock" });
      return result.fields.map((f: any) => f.name);
    };

    // Helper to get field by name
    const getField = (name: string) => {
      const result = fieldsTool.listFields({ asset_type: "stock" });
      return result.fields.find((f: any) => f.name === name);
    };

    describe("Margin Fields (4)", () => {
      it("should include gross_margin", () => {
        const fieldNames = getAllFieldNames();
        assert.ok(
          fieldNames.includes("gross_margin"),
          "Should have gross_margin field"
        );

        const field = getField("gross_margin");
        assert.strictEqual(field?.category, "fundamental");
        assert.strictEqual(field?.type, "percent");
      });

      it("should include gross_margin_ttm", () => {
        const field = getField("gross_margin_ttm");
        assert.ok(field, "gross_margin_ttm should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "percent");
        assert.ok(
          field.description.includes("trailing twelve months") ||
            field.description.includes("TTM"),
          "Description should mention TTM"
        );
      });

      it("should include operating_margin_ttm", () => {
        const field = getField("operating_margin_ttm");
        assert.ok(field, "operating_margin_ttm should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "percent");
      });

      it("should include pre_tax_margin_ttm", () => {
        const field = getField("pre_tax_margin_ttm");
        assert.ok(field, "pre_tax_margin_ttm should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "percent");
      });
    });

    describe("Return Fields (3)", () => {
      it("should include return_on_assets", () => {
        const field = getField("return_on_assets");
        assert.ok(field, "return_on_assets should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "percent");
      });

      it("should include return_on_assets_fq", () => {
        const field = getField("return_on_assets_fq");
        assert.ok(field, "return_on_assets_fq should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "percent");
        assert.ok(
          field.description.includes("fiscal quarter") ||
            field.description.includes("FQ"),
          "Description should mention fiscal quarter"
        );
      });

      it("should include return_on_invested_capital_fq", () => {
        const field = getField("return_on_invested_capital_fq");
        assert.ok(field, "return_on_invested_capital_fq should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "percent");
        assert.ok(
          field.description.includes("invested capital") ||
            field.description.includes("ROIC"),
          "Description should mention invested capital or ROIC"
        );
      });
    });

    describe("Operating Expense Ratios (2)", () => {
      it("should include research_and_dev_ratio_ttm", () => {
        const field = getField("research_and_dev_ratio_ttm");
        assert.ok(field, "research_and_dev_ratio_ttm should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "percent");
        assert.ok(
          field.description.toLowerCase().includes("research") ||
            field.description.includes("R&D"),
          "Description should mention research or R&D"
        );
      });

      it("should include sell_gen_admin_exp_other_ratio_ttm", () => {
        const field = getField("sell_gen_admin_exp_other_ratio_ttm");
        assert.ok(field, "sell_gen_admin_exp_other_ratio_ttm should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "percent");
        assert.ok(
          field.description.includes("SG&A") ||
            field.description.includes("administrative"),
          "Description should mention SG&A or administrative"
        );
      });
    });

    describe("Balance Sheet Fields (3)", () => {
      it("should include total_assets", () => {
        const field = getField("total_assets");
        assert.ok(field, "total_assets should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "currency");
      });

      it("should include total_debt", () => {
        const field = getField("total_debt");
        assert.ok(field, "total_debt should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "currency");
      });

      it("should include current_ratio", () => {
        const field = getField("current_ratio");
        assert.ok(field, "current_ratio should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "number");
        assert.ok(
          field.description.includes("liquidity") ||
            field.description.includes("current assets"),
          "Description should mention liquidity or current assets"
        );
      });
    });

    describe("Enterprise Value & Valuation Fields (5)", () => {
      it("should include enterprise_value_current", () => {
        const field = getField("enterprise_value_current");
        assert.ok(field, "enterprise_value_current should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "currency");
        assert.ok(
          field.description.toLowerCase().includes("market cap") ||
            field.description.toLowerCase().includes("debt"),
          "Description should mention market cap or debt"
        );
      });

      it("should include enterprise_value_to_ebit_ttm", () => {
        const field = getField("enterprise_value_to_ebit_ttm");
        assert.ok(field, "enterprise_value_to_ebit_ttm should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "number");
        assert.ok(
          field.description.includes("EV/EBIT") ||
            field.description.includes("EBIT"),
          "Description should mention EV/EBIT or EBIT"
        );
      });

      it("should include enterprise_value_ebitda_ttm", () => {
        const field = getField("enterprise_value_ebitda_ttm");
        assert.ok(field, "enterprise_value_ebitda_ttm should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "number");
        assert.ok(
          field.description.includes("EV/EBITDA") ||
            field.description.includes("EBITDA"),
          "Description should mention EV/EBITDA or EBITDA"
        );
      });

      it("should include price_earnings_growth_ttm", () => {
        const field = getField("price_earnings_growth_ttm");
        assert.ok(field, "price_earnings_growth_ttm should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "number");
        assert.ok(
          field.description.includes("PEG") ||
            field.description.includes("growth"),
          "Description should mention PEG or growth"
        );
      });

      it("should include ebitda", () => {
        const field = getField("ebitda");
        assert.ok(field, "ebitda should exist");
        assert.strictEqual(field.category, "fundamental");
        assert.strictEqual(field.type, "currency");
      });
    });

    describe("Risk Metrics (2)", () => {
      it("should include beta_1_year", () => {
        const field = getField("beta_1_year");
        assert.ok(field, "beta_1_year should exist");
        assert.strictEqual(field.category, "technical");
        assert.strictEqual(field.type, "number");
        assert.ok(
          field.description.includes("beta") ||
            field.description.includes("volatility"),
          "Description should mention beta or volatility"
        );
      });

      it("should include beta_5_year", () => {
        const field = getField("beta_5_year");
        assert.ok(field, "beta_5_year should exist");
        assert.strictEqual(field.category, "technical");
        assert.strictEqual(field.type, "number");
      });
    });

    it("should have all 19 new comprehensive fields", () => {
      const fieldNames = getAllFieldNames();

      const newFields = [
        // Margins (4)
        "gross_margin",
        "gross_margin_ttm",
        "operating_margin_ttm",
        "pre_tax_margin_ttm",
        // Returns (3)
        "return_on_assets",
        "return_on_assets_fq",
        "return_on_invested_capital_fq",
        // Operating ratios (2)
        "research_and_dev_ratio_ttm",
        "sell_gen_admin_exp_other_ratio_ttm",
        // Balance sheet (3)
        "total_assets",
        "total_debt",
        "current_ratio",
        // Enterprise value & valuation (5)
        "enterprise_value_current",
        "enterprise_value_to_ebit_ttm",
        "enterprise_value_ebitda_ttm",
        "price_earnings_growth_ttm",
        "ebitda",
        // Risk (2)
        "beta_1_year",
        "beta_5_year",
      ];

      assert.strictEqual(newFields.length, 19, "Should have exactly 19 new fields in the test");

      const missingFields = newFields.filter((name) => !fieldNames.includes(name));
      assert.strictEqual(
        missingFields.length,
        0,
        `Missing fields: ${missingFields.join(", ")}`
      );
    });

    it("should have correct categories for all new fields", () => {
      const fundamentalFields = [
        "gross_margin",
        "gross_margin_ttm",
        "operating_margin_ttm",
        "pre_tax_margin_ttm",
        "return_on_assets",
        "return_on_assets_fq",
        "return_on_invested_capital_fq",
        "research_and_dev_ratio_ttm",
        "sell_gen_admin_exp_other_ratio_ttm",
        "total_assets",
        "total_debt",
        "current_ratio",
        "enterprise_value_current",
        "enterprise_value_to_ebit_ttm",
        "enterprise_value_ebitda_ttm",
        "price_earnings_growth_ttm",
        "ebitda",
      ];

      const technicalFields = ["beta_1_year", "beta_5_year"];

      fundamentalFields.forEach((name) => {
        const field = getField(name);
        assert.strictEqual(
          field?.category,
          "fundamental",
          `${name} should be in fundamental category`
        );
      });

      technicalFields.forEach((name) => {
        const field = getField(name);
        assert.strictEqual(
          field?.category,
          "technical",
          `${name} should be in technical category`
        );
      });
    });
  });
});
