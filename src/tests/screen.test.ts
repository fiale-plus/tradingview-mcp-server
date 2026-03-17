import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { ScreenTool } from "../tools/screen.js";
import type { TradingViewClient } from "../api/client.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";

describe("ScreenTool - Filter Validation", () => {
  // Create mock dependencies
  const mockClient = {
    scanStocks: mock.fn(),
    scanForex: mock.fn(),
    scanCrypto: mock.fn(),
  } as unknown as TradingViewClient;

  const mockCache = {
    get: mock.fn(() => null),
    set: mock.fn(),
    startCleanup: mock.fn(),
  } as unknown as Cache;

  const mockRateLimiter = {
    acquire: mock.fn(async () => {}),
  } as unknown as RateLimiter;

  const screenTool = new ScreenTool(mockClient, mockCache, mockRateLimiter);

  describe("Invalid filter structure", () => {
    it("should reject array filters instead of objects", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            // @ts-expect-error Testing invalid input
            filters: [["field", "operator", "value"]],
          });
        },
        {
          message: /Invalid filter at index 0: expected object with \{field, operator, value\}/,
        }
      );
    });

    it("should reject null filters", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            // @ts-expect-error Testing invalid input
            filters: [null],
          });
        },
        {
          message: /Invalid filter at index 0: expected object/,
        }
      );
    });

    it("should reject undefined filters", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            // @ts-expect-error Testing invalid input
            filters: [undefined],
          });
        },
        {
          message: /Invalid filter at index 0: expected object/,
        }
      );
    });

    it("should reject primitive filters", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            // @ts-expect-error Testing invalid input
            filters: ["string"],
          });
        },
        {
          message: /Invalid filter at index 0: expected object/,
        }
      );
    });
  });

  describe("Missing required properties", () => {
    it("should reject filters missing field property", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            filters: [
              // @ts-expect-error Testing invalid input
              {
                operator: "greater",
                value: 10,
              },
            ],
          });
        },
        {
          message: /Invalid filter at index 0: missing required properties.*field: undefined/,
        }
      );
    });

    it("should reject filters missing operator property", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            filters: [
              // @ts-expect-error Testing invalid input
              {
                field: "market_cap_basic",
                value: 10,
              },
            ],
          });
        },
        {
          message: /Invalid filter at index 0: missing required properties.*operator: undefined/,
        }
      );
    });

    it("should reject filters missing value property", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            filters: [
              // value omitted to test runtime validation (non-empty/not_empty operators require value)
              {
                field: "market_cap_basic",
                operator: "greater",
              },
            ],
          });
        },
        {
          message: /Invalid filter at index 0: missing required properties.*value: undefined/,
        }
      );
    });

    it("should allow value to be 0 or false", async () => {
      // Mock successful response
      (mockClient.scanStocks as any).mock.mockImplementation(async () => ({
        totalCount: 0,
        data: [],
      }));

      // Should not throw for value: 0
      await assert.doesNotReject(async () => {
        await screenTool.screenStocks({
          filters: [
            {
              field: "market_cap_basic",
              operator: "greater",
              value: 0,
            },
          ],
        });
      });

      // Should not throw for value: false
      await assert.doesNotReject(async () => {
        await screenTool.screenStocks({
          filters: [
            {
              field: "is_primary",
              operator: "equal",
              value: false,
            },
          ],
        });
      });
    });
  });

  describe("Invalid operators", () => {
    it("should reject unknown operator", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            filters: [
              {
                field: "market_cap_basic",
                operator: "invalid_operator",
                value: 10,
              },
            ],
          });
        },
        {
          message: /Unknown operator: invalid_operator\. Valid operators:/,
        }
      );
    });

    it("should list all valid operators in error message", async () => {
      try {
        await screenTool.screenStocks({
          filters: [
            {
              field: "market_cap_basic",
              operator: "bad_op",
              value: 10,
            },
          ],
        });
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        assert.ok(error.message.includes("greater"));
        assert.ok(error.message.includes("less"));
        assert.ok(error.message.includes("greater_or_equal"));
        assert.ok(error.message.includes("less_or_equal"));
        assert.ok(error.message.includes("equal"));
        assert.ok(error.message.includes("in_range"));
      }
    });

    it("should accept all valid operators", async () => {
      // Mock successful response
      (mockClient.scanStocks as any).mock.mockImplementation(async () => ({
        totalCount: 0,
        data: [],
      }));

      const validOperators = [
        "greater",
        "less",
        "greater_or_equal",
        "less_or_equal",
        "equal",
        "not_equal",
        "in_range",
        "not_in_range",
        "crosses",
        "crosses_above",
        "crosses_below",
        "match",
        "above_percent",
        "below_percent",
        "has",
        "has_none_of",
      ];

      for (const operator of validOperators) {
        await assert.doesNotReject(
          async () => {
            await screenTool.screenStocks({
              filters: [
                {
                  field: "market_cap_basic",
                  operator,
                  value: operator === "in_range" || operator === "not_in_range" ? [10, 100]
                    : operator === "above_percent" || operator === "below_percent" ? ["SMA200", 10]
                    : operator === "has" || operator === "has_none_of" ? ["common"]
                    : 10,
                },
              ],
            });
          },
          `Operator "${operator}" should be valid`
        );
      }

      // empty/not_empty are valid without a value
      for (const operator of ["empty", "not_empty"]) {
        await assert.doesNotReject(
          async () => {
            await screenTool.screenStocks({
              // value intentionally omitted for no-value operators
              filters: [
                {
                  field: "dividends_yield_current",
                  operator,
                },
              ],
            });
          },
          `Operator "${operator}" should be valid without value`
        );
      }
    });
  });

  describe("New operators (empty, not_empty, above_percent, below_percent, has, has_none_of)", () => {
    beforeEach(() => {
      (mockClient.scanStocks as any).mock.mockImplementation(async () => ({
        totalCount: 0,
        data: [],
      }));
    });

    it("should allow empty operator without value", async () => {
      await assert.doesNotReject(async () => {
        await screenTool.screenStocks({
          // value intentionally omitted for no-value operators
          filters: [{ field: "dividends_yield_current", operator: "empty" }],
        });
      });
    });

    it("should allow not_empty operator without value", async () => {
      await assert.doesNotReject(async () => {
        await screenTool.screenStocks({
          // value intentionally omitted for no-value operators
          filters: [{ field: "dividends_yield_current", operator: "not_empty" }],
        });
      });
    });

    it("should convert empty to 'empty' TradingView operation without right property", async () => {
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        const f = request.filter[0];
        assert.strictEqual(f.left, "dividends_yield_current");
        assert.strictEqual(f.operation, "empty");
        // right should be undefined (dropped by JSON.stringify)
        assert.strictEqual(f.right, undefined);
        return { totalCount: 0, data: [] };
      });

      await screenTool.screenStocks({
        // value intentionally omitted for no-value operators
        filters: [{ field: "dividends_yield_current", operator: "empty" }],
      });
    });

    it("should convert not_empty to 'nempty' TradingView operation", async () => {
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        const f = request.filter[0];
        assert.strictEqual(f.operation, "nempty");
        assert.strictEqual(f.right, undefined);
        return { totalCount: 0, data: [] };
      });

      await screenTool.screenStocks({
        // value intentionally omitted for no-value operators
        filters: [{ field: "dividends_yield_current", operator: "not_empty" }],
      });
    });

    it("should convert above_percent to 'above%' TradingView operation", async () => {
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        const f = request.filter[0];
        assert.strictEqual(f.operation, "above%");
        assert.deepStrictEqual(f.right, ["SMA200", 10]);
        return { totalCount: 0, data: [] };
      });

      await screenTool.screenStocks({
        filters: [{ field: "close", operator: "above_percent", value: ["SMA200", 10] }],
      });
    });

    it("should convert below_percent to 'below%' TradingView operation", async () => {
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        const f = request.filter[0];
        assert.strictEqual(f.operation, "below%");
        assert.deepStrictEqual(f.right, ["SMA50", 5]);
        return { totalCount: 0, data: [] };
      });

      await screenTool.screenStocks({
        filters: [{ field: "close", operator: "below_percent", value: ["SMA50", 5] }],
      });
    });

    it("should convert has to 'has' TradingView operation", async () => {
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        const f = request.filter[0];
        assert.strictEqual(f.operation, "has");
        assert.deepStrictEqual(f.right, ["common"]);
        return { totalCount: 0, data: [] };
      });

      await screenTool.screenStocks({
        filters: [{ field: "typespecs", operator: "has", value: ["common"] }],
      });
    });

    it("should convert has_none_of to 'has_none_of' TradingView operation", async () => {
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        const f = request.filter[0];
        assert.strictEqual(f.operation, "has_none_of");
        assert.deepStrictEqual(f.right, ["preferred"]);
        return { totalCount: 0, data: [] };
      });

      await screenTool.screenStocks({
        filters: [{ field: "typespecs", operator: "has_none_of", value: ["preferred"] }],
      });
    });

    it("should require value for above_percent operator", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            // value omitted to test runtime validation
            filters: [{ field: "close", operator: "above_percent" }],
          });
        },
        { message: /missing required properties/ }
      );
    });

    it("should require value for has operator", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            // value omitted to test runtime validation
            filters: [{ field: "typespecs", operator: "has" }],
          });
        },
        { message: /missing required properties/ }
      );
    });
  });

  describe("Multiple filter validation", () => {
    it("should report correct index for invalid filter in array", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            filters: [
              {
                field: "market_cap_basic",
                operator: "greater",
                value: 10,
              },
              {
                field: "return_on_equity",
                operator: "greater",
                value: 15,
              },
              {
                // Invalid filter at index 2
                field: "price_earnings_ttm",
                operator: "invalid",
                value: 25,
              },
            ],
          });
        },
        {
          message: /Unknown operator: invalid/,
        }
      );
    });
  });

  describe("Filter validation in different screen methods", () => {
    it("should validate filters in screenForex", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenForex({
            filters: [
              {
                field: "volume",
                operator: "bad_operator",
                value: 1000,
              },
            ],
          });
        },
        {
          message: /Unknown operator: bad_operator/,
        }
      );
    });

    it("should validate filters in screenCrypto", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenCrypto({
            filters: [
              // value omitted to test runtime validation
              {
                field: "market_cap_basic",
                operator: "greater",
              },
            ],
          });
        },
        {
          message: /Invalid filter at index 0: missing required properties/,
        }
      );
    });

    it("should validate filters in screenETF", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenETF({
            filters: [
              {
                field: "volume",
                operator: "invalid_operator",
                value: 1000000,
              },
            ],
          });
        },
        {
          message: /Unknown operator: invalid_operator/,
        }
      );
    });

    it("should accept valid filters in screenETF", async () => {
      // Mock successful response
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        // Verify ETF-specific type filter is added
        const typeFilter = request.filter.find((f: any) => f.left === "type");
        assert.ok(typeFilter, "Should have type filter");
        assert.strictEqual(typeFilter.operation, "equal");
        assert.strictEqual(typeFilter.right, "fund");

        return {
          totalCount: 0,
          data: [],
        };
      });

      await assert.doesNotReject(async () => {
        await screenTool.screenETF({
          filters: [
            {
              field: "volume",
              operator: "greater",
              value: 1000000,
            },
          ],
        });
      });
    });
  });

  describe("Valid filter conversion", () => {
    it("should convert valid filters to TradingView format", async () => {
      // Mock successful response
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        // Verify the filter was converted correctly
        assert.strictEqual(request.filter.length, 1);
        assert.strictEqual(request.filter[0].left, "market_cap_basic");
        assert.strictEqual(request.filter[0].operation, "egreater"); // greater_or_equal maps to egreater
        assert.strictEqual(request.filter[0].right, 1000000000);

        return {
          totalCount: 0,
          data: [],
        };
      });

      await screenTool.screenStocks({
        filters: [
          {
            field: "market_cap_basic",
            operator: "greater_or_equal",
            value: 1000000000,
          },
        ],
      });
    });

    it("should handle in_range operator with array value", async () => {
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        assert.strictEqual(request.filter[0].operation, "in_range");
        assert.deepStrictEqual(request.filter[0].right, [45, 65]);

        return {
          totalCount: 0,
          data: [],
        };
      });

      await screenTool.screenStocks({
        filters: [
          {
            field: "RSI",
            operator: "in_range",
            value: [45, 65],
          },
        ],
      });
    });

    it("should handle string comparison for field-to-field filters", async () => {
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        assert.strictEqual(request.filter[0].left, "SMA50");
        assert.strictEqual(request.filter[0].operation, "egreater");
        assert.strictEqual(request.filter[0].right, "SMA200");

        return {
          totalCount: 0,
          data: [],
        };
      });

      await screenTool.screenStocks({
        filters: [
          {
            field: "SMA50",
            operator: "greater_or_equal",
            value: "SMA200",
          },
        ],
      });
    });
  });
});
